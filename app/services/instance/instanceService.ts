import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";
import type { Provider } from "./providerConfig";
import { getProviderConfig } from "./providerConfig";

interface InstanceValidation {
    exists: boolean;
    authorized: boolean;
    stateInstance: string | null;
}

// Legacy states that can't send right now, so moving the store to Greener interrupts
// nothing. Anything else (e.g. "starting") may still come back as authorized.
const SWITCHABLE_LEGACY_STATES = new Set(["notAuthorized", "blocked", "yellowCard", "sleepMode"]);

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
        if (typeof data?.stateInstance !== "string") {
            throw new Error("WhatsApp returned an invalid connection status. Please try again.");
        }
        return {
            exists: true,
            authorized: data.stateInstance === "authorized",
            stateInstance: data.stateInstance,
        };
    }

    const textData = await response.text();

    if (textData.includes("is deleted")) {
        await fireStoreDeleteService("InstanceData", shop);
        return { exists: false, authorized: false, stateInstance: null };
    }

    // A provider outage must not trigger migration of a potentially live store.
    throw new Error(`Unable to check WhatsApp connection status (HTTP ${response.status}). Please try again.`);
}

async function createGreenerInstance(shop: string) {
    const { partnerApiUrl, partnerToken } = getProviderConfig("greener");

    const response = await fetch(`${partnerApiUrl}/partner/createInstance/${partnerToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shop }),
    });

    if (!response.ok) {
        throw new Error("Failed to create Greener instance");
    }

    const data = await response.json();

    if (!data.idInstance || !data.apiTokenInstance) {
        throw new Error("Greener returned incomplete instance credentials");
    }

    // Use the configured URL: the partner response can omit the /greenerApi path.
    const instance = {
        shop,
        idInstance: data.idInstance,
        apiTokenInstance: data.apiTokenInstance,
        apiUrl: partnerApiUrl,
        provider: "greener" as const,
    };

    const saved = await fireStoreCreateService("InstanceData", shop, instance, { merge: true });
    if (!saved.success) {
        throw new Error("Failed to save Greener instance");
    }
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
// instance still exists. Existing connections are left for the merchant to migrate
// on the connection page; any missing instance is always created with Greener.
export async function getOrCreateInstance(shop: string) {
    let instance = await fireStoreFetchService("InstanceData", shop);

    if (instance) {
        const { exists } = await validateInstance(instance, shop);
        if (!exists) {
            instance = null;
        }
    }

    if (!instance) {
        instance = await createGreenerInstance(shop);
    }

    console.log(`[instanceService] ${shop} (background) using provider: ${instance.provider ?? "legacy"}`);
    return instance;
}

// Preserve authorized connections. Every new connection and disconnected legacy
// instance uses Greener, regardless of any saved whatsAppStrategy override.
const pendingConnections = new Map<string, Promise<any>>();

export async function resolveInstanceForConnect(shop: string) {
    // The page loader and QR polls may overlap; share the same migration rather
    // than provisioning multiple accounts for one store in this server process.
    const pending = pendingConnections.get(shop);
    if (pending) return pending;

    const connection = resolveConnection(shop);
    pendingConnections.set(shop, connection);
    try {
        return await connection;
    } finally {
        pendingConnections.delete(shop);
    }
}

async function resolveConnection(shop: string) {
    const instance = await fireStoreFetchService("InstanceData", shop);

    if (!instance) {
        const created = await createGreenerInstance(shop);
        console.log(`[instanceService] ${shop} has no instance yet — created under provider: ${created.provider}`);
        return created;
    }

    const { exists, authorized, stateInstance } = await validateInstance(instance, shop);

    if (!exists) {
        const created = await createGreenerInstance(shop);
        console.log(`[instanceService] ${shop}'s instance no longer exists — recreated under provider: ${created.provider}`);
        return created;
    }

    if (authorized) {
        console.log(`[instanceService] ${shop} is actively connected on provider: ${instance.provider ?? "legacy"}`);
        return { ...instance, stateInstance };
    }

    const currentProvider: Provider = instance.provider ?? "legacy";
    if (currentProvider === "greener") {
        console.log(`[instanceService] ${shop} is disconnected, staying on provider: ${currentProvider}`);
        return instance;
    }

    // Transient or unknown state: keep the legacy instance and let the page keep
    // polling until it settles as authorized or switchable.
    if (!SWITCHABLE_LEGACY_STATES.has(stateInstance as string)) {
        console.log(`[instanceService] ${shop} legacy instance is in state "${stateInstance}", waiting before switching provider`);
        return { ...instance, stateInstance };
    }

    // Provision and save first so configuration or creation failures leave the old
    // instance intact. The merchant must scan the new Greener QR to reconnect.
    const created = await createGreenerInstance(shop);
    await fireStoreDeleteService("ConnectPagedata", shop);
    await deleteInstanceAccount(instance);
    console.log(`[instanceService] ${shop} switched provider: ${currentProvider} (${stateInstance}) -> ${created.provider}`);
    return created;
}
