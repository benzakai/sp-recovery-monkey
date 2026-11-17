const messageKeys = [
    "followUpMessage",
    "orderConfirmationMessage",
    "fulfillmentMessage",
    "reviewRequestMessage",
] as const;

export const REVIEW_REQUEST_DURATIONS = ["After 7 days", "After 14 days", "After 30 days"] as const;

// Preserve merchant wording and actual review URLs; only fix known legacy tokens.
export function normalizeSettingsMessageTemplates<T extends Record<string, unknown>>(settings: T): T {
    const normalized: Record<string, unknown> = { ...settings };

    // Partial settings updates must not add or overwrite an omitted timing.
    if ("durationToSendReviewRequest" in settings) {
        normalized.durationToSendReviewRequest = REVIEW_REQUEST_DURATIONS.find(
            (duration) => duration === settings.durationToSendReviewRequest,
        ) ?? REVIEW_REQUEST_DURATIONS[0];
    }

    for (const key of messageKeys) {
        const message = settings[key];
        if (!message || typeof message !== "object" || Array.isArray(message)) continue;

        const template: Record<string, unknown> = { ...message };
        for (const field of ["header", "content"] as const) {
            const text = template[field];
            if (typeof text === "string") {
                template[field] = text.replace(
                    /\{\{\s*(order_number|tracking_url|review_link)\s*\}\}/g,
                    "[$1]",
                );
            }
        }
        normalized[key] = template;
    }

    return normalized as T;
}
