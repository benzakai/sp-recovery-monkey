import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const { url, id, token } = await request.json();
    // console.log("url, id, token", url, id, token);

    try {
        const logoutResponse = await fetch(`${url}/waInstance${id}/logout/${token}`)
        const data = await logoutResponse.json()
        // console.log("logoutResponse data", data);
        return json({ success: true })

    } catch (error) {
        console.error("error on disconnectInstance:", error);
        return json({ error: error, message: 'error occurred on disconnectInstance' });
    }
};
