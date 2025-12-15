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
                content: "This is Danny. I just wanted to make sure you managed to complete your order. If not, you can easily finish it here: \n\n👉 [Direct checkout link] \n If you have any questions, feel free to reply here. Either I or someone from the team will get back to you as soon as possible. \n\n Wishing you a lovely day, \n Danny \n Team [Store Name]"
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
