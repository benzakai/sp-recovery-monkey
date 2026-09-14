export type Provider = "legacy" | "greener";

interface ProviderConfig {
    partnerApiUrl: string;
    partnerToken: string;
    qrMethod: "qr" | "getQR";
    stateMethod: "getWaSettings" | "getStateInstance";
}

// Greener is the default for every store. Green-API stays in place as the manual
// fallback: set whatsAppStrategy = "legacy" on Firestore settings/<shop> to put that
// store back on Green-API. The switch only takes effect once the store is no longer
// authorized, so it never interrupts a live connection.
export function resolveStrategy(whatsAppStrategy: string | null | undefined): Provider {
    if (whatsAppStrategy === "legacy") return "legacy";

    // Never default a store onto Greener in an environment where it isn't configured —
    // a missing env var should degrade to Green-API, not break every new install.
    const greenerConfigured = Boolean(
        process.env.GREENER_API_BASE_URL && process.env.GREENER_PARTNER_TOKEN
    );
    return greenerConfigured ? "greener" : "legacy";
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
