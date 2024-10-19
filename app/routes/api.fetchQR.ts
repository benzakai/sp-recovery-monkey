import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";



export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const {url,id,token} = await request.json();
    const storeId = session.shop;

    try {
        const response = await fetch(`${url}/waInstance${id}/qr/${token}`);
        const qrData = await response.json();
        return {qrData,storeId };
    } catch (error) {
        console.error('Error fetching qr ', error);
        return { error: error.message };
    }
}