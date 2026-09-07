import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";
import type { Provider } from "./providerConfig";
import { getProviderConfig, resolveStrategy } from "./providerConfig";

interface InstanceValidation {
    exists: boolean;
    authorized: boolean;
}

async function validateInstance(instance: any, shop: string): Promise<InstanceValidation> {
    const response = await fetch(
        `${instance.apiUrl}/waInstance${instance.idInstance}/getStateInstance/${instance.apiTokenInstance}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }
    );

    if (response.ok) {
        const data = await response.json();
        return { exists: true, authorized: data?.stateInstance === "authorized" };
    }

    const textData = await response.text();

    if (textData.includes("is deleted")) {
        await fireStoreDeleteService("InstanceData", shop);
        return { exists: false, authorized: false };
    }

    return { exists: true, authorized: false };
}

async function createInstance(shop: string, provider: Provider) {
    const { partnerApiUrl, partnerToken } = getProviderConfig(provider);

    const response = await fetch(`${partnerApiUrl}/partner/createInstance/${partnerToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(provider === "greener" ? { body: JSON.stringify({ name: shop }) } : {}),
    });

    if (!response.ok) {
        throw new Error("Failed to create instance");
    }

    const data = await response.json();

    // Both providers override apiUrl with our own known-good base URL rather than
    // trusting the partner response's apiUrl field: legacy has always done this, and
    // testing showed Greener's createInstance response returns an incomplete apiUrl
    // (missing the /greenerApi path segment, wrong protocol) that 404s if used as-is.
    const instance =
        provider === "greener"
            ? {
                shop,
                idInstance: data.idInstance,
                apiTokenInstance: data.apiTokenInstance,
                apiUrl: process.env.GREENER_API_BASE_URL,
                provider,
            }
            : {
                shop,
                ...data,
                apiUrl: process.env.API_URL,
                provider,
            };

    await fireStoreCreateService("InstanceData", shop, instance, { merge: true });
    return instance;
}

export async function logoutInstance(instance: any): Promise<void> {
    try {
        await fetch(`${instance.apiUrl}/waInstance${instance.idInstance}/logout/${instance.apiTokenInstance}`);
    } catch (error) {
        console.warn("logoutInstance failed", error);
    }
}

export async function deleteInstanceAccount(instance: any): Promise<boolean> {
    try {
        const { partnerApiUrl, partnerToken } = getProviderConfig((instance.provider as Provider) ?? "legacy");
        const response = await fetch(`${partnerApiUrl}/partner/deleteInstanceAccount/${partnerToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idInstance: instance.idInstance }),
        });
        return response.ok;
    } catch (error) {
        console.warn("deleteInstanceAccount failed", error);
        return false;
    }
}

// Background/non-interactive callers (e.g. SmartBulk). Only reacts to whether the
// instance still exists — never reacts to authorization state or the merchant's
// whatsAppStrategy, so it never disrupts a merchant who simply hasn't reconnected yet.
export async function getOrCreateInstance(shop: string) {
    let instance = await fireStoreFetchService("InstanceData", shop);

    if (instance) {
        const { exists } = await validateInstance(instance, shop);
        if (!exists) {
            instance = null;
        }
    }

    if (!instance) {
        const settings = await fireStoreFetchService("settings", shop);
        const provider = resolveStrategy(settings?.whatsAppStrategy);
        instance = await createInstance(shop, provider);
    }

    console.log(`[instanceService] ${shop} (background) using provider: ${instance.provider ?? "legacy"}`);
    return instance;
}

// Interactive connect-page path only. Never touches an actively-connected merchant —
// the whatsAppStrategy switch only takes effect once the merchant's instance is no
// longer authorized (never connected yet, or manually disconnected).
export async function resolveInstanceForConnect(shop: string) {
    const settings = await fireStoreFetchService("settings", shop);
    const desiredProvider = resolveStrategy(settings?.whatsAppStrategy);

    const instance = await fireStoreFetchService("InstanceData", shop);

    if (!instance) {
        const created = await createInstance(shop, desiredProvider);
        console.log(`[instanceService] ${shop} has no instance yet — created under provider: ${created.provider}`);
        return created;
    }

    const { exists, authorized } = await validateInstance(instance, shop);

    if (!exists) {
        const created = await createInstance(shop, desiredProvider);
        console.log(`[instanceService] ${shop}'s instance no longer exists — recreated under provider: ${created.provider}`);
        return created;
    }

    if (authorized) {
        console.log(`[instanceService] ${shop} is actively connected on provider: ${instance.provider ?? "legacy"} (current strategy: ${desiredProvider})`);
        return instance;
    }

    const currentProvider: Provider = instance.provider ?? "legacy";
    if (currentProvider === desiredProvider) {
        console.log(`[instanceService] ${shop} is disconnected, staying on provider: ${currentProvider}`);
        return instance;
    }

    // Safe to switch here: the instance exists but isn't authorized, so there's
    // nothing live to interrupt. Clean up the old (already-disconnected) instance
    // before provisioning the new one, best-effort.
    await deleteInstanceAccount(instance);
    const created = await createInstance(shop, desiredProvider);
    console.log(`[instanceService] ${shop} switched provider: ${currentProvider} -> ${created.provider}`);
    return created;
}
