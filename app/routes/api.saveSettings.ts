import { ActionFunctionArgs } from "@remix-run/node";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import { authenticate } from "~/shopify.server";
import { normalizeSettingsMessageTemplates } from "~/utils/messageTemplates";

export async function action({ request }: ActionFunctionArgs) {
    const data = normalizeSettingsMessageTemplates(await request.json());
    const { session } = await authenticate.admin(request);
    try {
        // console.log("datass", data);
        const result = await fireStoreCreateService("settings", session.shop, data, { merge: true });
        if (!result.success) {
            // console.error("[SETTINGS SAVE] Failed", JSON.stringify({ shop: session.shop }));
            return { success: false, error: "Failed to save settings" };
        }
        // console.log("[SETTINGS SAVE] Saved", JSON.stringify({ shop: session.shop, settings: data }));
        return ({ message: `Data successfully saved in "settings"`, success: true, data });
    } catch (error) {
        // console.error("[SETTINGS SAVE] Failed", JSON.stringify({
        //     shop: session.shop,
        //     error: error instanceof Error ? error.message : String(error),
        // }));
        return { error: error, success: false };
    }
}
