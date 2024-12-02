import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";



export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const data = await request.json();
    const storeId = session.shop;

    try {
        const response = await fetch(`${data?.url}/waInstance${data?.id}/getStateInstance/${data?.token}`);
        const responseData = await response.json();
        return json({ responseData, storeId });
    } catch (error) {
        return json({
            responseData: { stateInstance: "notAuthorized" },
            storeId
        });
    }
}