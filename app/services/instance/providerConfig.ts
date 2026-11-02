export type Provider = "legacy" | "greener";

interface ProviderConfig {
    partnerApiUrl: string;
    partnerToken: string;
    qrMethod: "qr" | "getQR";
    stateMethod: "getWaSettings" | "getStateInstance";
}

export function getProviderConfig(provider: Provider): ProviderConfig {
    if (provider === "greener") {
        const partnerApiUrl = process.env.GREENER_API_BASE_URL?.trim();
        const partnerToken = process.env.GREENER_PARTNER_TOKEN?.trim();

        if (!partnerApiUrl || !partnerToken) {
            throw new Error("Greener is not configured. Set GREENER_API_BASE_URL and GREENER_PARTNER_TOKEN before connecting WhatsApp.");
        }

        return {
            partnerApiUrl,
            partnerToken,
            qrMethod: "getQR",
            stateMethod: "getStateInstance",
        };
    }

    // Legacy configuration is only for maintaining and cleaning up existing
    // Green-API connections. All new instances must be created with Greener.
    return {
        partnerApiUrl: process.env.PARTNER_API_URL as string,
        partnerToken: process.env.PARTNER_TOKEN as string,
        qrMethod: "qr",
        stateMethod: "getWaSettings",
    };
}

// Greener's getStateInstance returns `phoneNumber`; legacy's getWaSettings already returns `.phone`.
export function normalizePhoneResponse(provider: Provider, data: any) {
    if (provider === "greener") {
        return { ...data, phone: data?.phoneNumber };
    }
    return data;
}
