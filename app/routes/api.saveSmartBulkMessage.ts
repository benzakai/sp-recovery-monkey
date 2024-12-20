import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreFetchService from "~/services/fireStoreFetchService";

interface MessageData {
    header: string;
    content: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const { header, content }: MessageData = await request.json();
    try {

        const firstMessage = await fireStoreFetchService("SmartBulkMessage", session.shop);

        if (!firstMessage) {
            console.error("No records found in SmartBulkMessage for this shop");
            const newMessage = await fireStoreCreateService("SmartBulkMessage", session.shop, {
                shop: session.shop,
                header,
                content
            }, {});
            console.log("created new message:", newMessage);
            return json({ message: 'New message created successfully', messageData: newMessage });
        } else {
            const updateMessage = await fireStoreCreateService("SmartBulkMessage", session.shop, {
                shop: session.shop,
                header,
                content
            }, {});
            console.log("updated message:", updateMessage);
            return json({ message: 'Message updated successfully', messageData: updateMessage });
        }

    } catch (error) {
        console.error("error occurred while saving the custom message:", error);
        return json({ error: error, message: 'error occurred on main custom message' });
    }
};
