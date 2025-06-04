import { ActionFunctionArgs } from "@remix-run/node";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import { authenticate } from "~/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
    const data = await request.json();
    const { session } = await authenticate.admin(request);
    try {
        // console.log("datass from saveAIChatbotSettings", data);
        await fireStoreCreateService("AIChatbotSettings", session.shop, data, { merge: true });
        // console.log("Data successfully saved in 'saveAIChatbotSettings'");
        return ({ message: `Data successfully saved in "saveAIChatbotSettings"`, success: true, data });
    } catch (error) {
        return { error: error, success: false };
    }
}