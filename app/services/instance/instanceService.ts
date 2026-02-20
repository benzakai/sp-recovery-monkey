import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";

async function validateInstance(instance: any, shop: string): Promise<boolean> {
    const response = await fetch(
        `${instance.apiUrl}/waInstance${instance.idInstance}/getStateInstance/${instance.apiTokenInstance}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }
    );

    if (response.ok) {
        await response.json();
        return true;
    }

    const textData = await response.text();

    if (textData.includes("is deleted")) {
        await fireStoreDeleteService("InstanceData", shop);
        return false;
    }

    return true;
}

async function createInstance(shop: string) {
    const response = await fetch(
        `${process.env.PARTNER_API_URL}/partner/createInstance/${process.env.PARTNER_TOKEN}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create instance");
    }

    const data = await response.json();

    const instance = {
        shop,
        ...data,
        apiUrl: process.env.API_URL,
    };

    await fireStoreCreateService("InstanceData", shop, instance, {});
    return instance;
}


export async function getOrCreateInstance(shop: string) {
    let instance = await fireStoreFetchService("InstanceData", shop);

    if (instance) {
        const isValid = await validateInstance(instance, shop);
        if (!isValid) {
            instance = null;
        }
    }

    if (!instance) {
        instance = await createInstance(shop);
    }

    return instance;
}
