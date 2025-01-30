import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";

export const loader = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);

    try {
        const messageData = await fireStoreFetchService("SmartBulkMessage", session.shop)
        if (!messageData) {
            const newMessage = await fireStoreCreateService("SmartBulkMessage", session.shop, {
                shop: session.shop,
                header: "👋 Hi [Customer's Name],",
                content: "✨ Exciting news from our store ✨\n 🎉 We’re running an exclusive limited-time sale on your favorite items! 🛍️ Don’t miss out – enjoy discounts of up to 30% off on selected products.\n 💡 Hurry, the sale ends soon, and stock is running out fast! 🕒 \n 👉 Shop the sale now: [Link to store]"
            }, {});
            console.log("Created new sync status:", newMessage);
            return json({ success: 'Message saved successfully', messageData: newMessage });
        }
        return json({ success: 'Message retrieved successfully', messageData });
    } catch (error) {
        console.log("Error on getSmartBulkMessage:", error);
        return json({ error: error, message: 'Error occurred on main custom message' });
    }
};
