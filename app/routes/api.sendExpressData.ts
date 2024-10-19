import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";



export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const {instance} = await request.json();
    const storeId = session.shop;

    try {
        const response = await fetch('https://73b2-103-252-170-47.ngrok-free.app/getQRData',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({instance,storeId}),
         });
         const data = await response.json();
        return {data};
    } catch (error) {
        console.error('Error fetching qr ', error);
        return { error: error.message };
    }
}