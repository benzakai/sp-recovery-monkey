import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getProviderConfig, normalizePhoneResponse } from "~/services/instance/providerConfig";

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const data = await request.json();
    const storeId = session.shop;

    try {
        const provider = data?.provider ?? "legacy";
        const { stateMethod } = getProviderConfig(provider);
        const response = await fetch(`${data?.url}/waInstance${data?.id}/${stateMethod}/${data?.token}`);
        const rawData = await response.json();
        const reponseData = normalizePhoneResponse(provider, rawData);
        return json({ reponseData, storeId });
    } catch (error) {
        return json({ error: error.message });
    }
}