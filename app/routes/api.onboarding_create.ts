import { Timestamp } from "@google-cloud/firestore";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: any) => {
    try {
        const { session } = await authenticate.admin(request);
        const onboarding = await fireStoreCreateService("onboardingProgress", session.shop, {
            hideOnboarding: false,
            step1: {
                connectWhatsapp: false,
                editMessage: false,
                sendTestMessage: false
            },
            step2: {
                startSync: false,
                chooseTone: false,
                installPreview: false
            },
            updatedAt: Timestamp.now()
        }, {});
        // console.log("onboarding created", onboarding);
        if (!onboarding.success) {
            return new Response(JSON.stringify({ error: "failed to create onboarding" }), { status: 500 });
        }
        return new Response(JSON.stringify({ successs: true }), { status: 200 });
    } catch (error) {
        console.log("error occured on create onboarding", error);
        return new Response(JSON.stringify({ error: error }), { status: 500 });
    }
};