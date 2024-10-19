import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";



export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const data = await request.json();
    const storeId = session.shop;

    try {
        const response = await fetch(`${data?.url}/waInstance${data?.id}/getWaSettings/${data?.token}`);
        const reponseData = await response.json();
        return {reponseData,storeId};
    } catch (error) {
        console.error('Error fetching qr ', error);
        return { error: error.message };
    }
}