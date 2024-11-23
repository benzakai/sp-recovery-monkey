import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const data = await request.json();
    const storeId = session.shop;

    try {
        const response = await fetch(`${data?.url}/waInstance${data?.id}/getWaSettings/${data?.token}`);
        const reponseData = await response.json();
        return json({ reponseData, storeId });
    } catch (error) {
        return json({ error: error.message });
    }
}