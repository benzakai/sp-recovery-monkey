import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getProviderConfig } from "~/services/instance/providerConfig";

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const { url, id, token, provider } = await request.json();
    const storeId = session.shop;
    // console.log("storeid from fetchQR", storeId);
    try {
        const { qrMethod } = getProviderConfig(provider ?? "legacy");
        const requestUrl = `${url}/waInstance${id}/${qrMethod}/${token}`;
        // console.log("fetchQR requesting:", requestUrl, "| provider:", provider);
        const response = await fetch(requestUrl);
        // console.log("fetchQR response status:", response.status);
        const qrData = await response.json();
        // console.log("qrData.....", qrData)
        return { qrData, storeId };
    } catch (error) {
        // console.log("error occured while fetchQR", error)
        return { error: error.message };
    }
}