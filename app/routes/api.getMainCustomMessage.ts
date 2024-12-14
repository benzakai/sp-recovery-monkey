import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";

export const loader = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);

    try {
        const messageData = await fireStoreFetchService("MainCustomMessage", session.shop)
        if (!messageData) {
            const newMessage = await fireStoreCreateService("MainCustomMessage", session.shop, {
                shop: session.shop,
                header: "Hi [Customer's Name]",
                content: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]"
            }, {});
            console.log("Created new sync status:", newMessage);
            return json({ success: 'Message saved successfully', messageData: newMessage });
        }
        return json({ success: 'Message retrieved successfully', messageData });
    } catch (error) {
        console.log("Error on getMainCustomMessage:", error);
        return json({ error: error, message: 'Error occurred on main custom message' });
    }
};
