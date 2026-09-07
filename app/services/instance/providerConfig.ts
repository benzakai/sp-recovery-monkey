export type Provider = "legacy" | "greener";

interface ProviderConfig {
    partnerApiUrl: string;
    partnerToken: string;
    qrMethod: "qr" | "getQR";
    stateMethod: "getWaSettings" | "getStateInstance";
}

export function resolveStrategy(whatsAppStrategy: string | null | undefined): Provider {
    return whatsAppStrategy === "greener" ? "greener" : "legacy";
}

export function getProviderConfig(provider: Provider): ProviderConfig {
    if (provider === "greener") {
        return {
            partnerApiUrl: process.env.GREENER_API_BASE_URL as string,
            partnerToken: process.env.GREENER_PARTNER_TOKEN as string,
            qrMethod: "getQR",
            stateMethod: "getStateInstance",
        };
    }

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
