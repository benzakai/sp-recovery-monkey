import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreFetchService from "~/services/fireStoreFetchService";

export const loader = async ({ request }: ActionFunctionArgs) => {
    // console.log("triggered api for api.extGetAIChatbotSettings.....................")
    try {
        const { session }: any = await authenticate.public.appProxy(request);

        const settings = await fireStoreFetchService("AIChatbotSettings", session.shop);

        return json({ success: true, settings })
    } catch (error) {
        console.error("error on api.extGetAIChatbotSettings:", error);
        return json({ error: error, message: 'error occurred on api.extGetAIChatbotSettings' });
    }
};
