import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Firestore } from "@google-cloud/firestore";

function sanitizeJSON(raw: string): string {
    return raw
        .replace(/[\r\n]+/g, "\\n")
        .replace(/\t/g, "\\t")
        .replace(/\\?"([^"]*?)\\?":/g, '"$1":')
        .replace(/\\?"/g, '\\"');
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const firestoreDatabase = new Firestore();
    try {
        const checkoutCollection = firestoreDatabase.collection('checkout');
        const doc = await checkoutCollection.doc(session.shop).get();
        const data = doc.data();
        const abandonedListCustomer: any[] = [];

        if (data) {
            for (const [key, value] of Object.entries(data)) {
                try {
                    abandonedListCustomer.push(JSON.parse(value as string));
                } catch (err) {
                    try {
                        const cleaned = sanitizeJSON(value as string);
                        abandonedListCustomer.push(JSON.parse(cleaned));
                    } catch (innerErr) {
                        // console.error(`Still invalid JSON at key "${key}" after sanitizing:`, value);
                    }
                }
            }
        }

        return json({ success: true, abandonedListCustomer });
    } catch (error) {
        // console.error("Error in abandonedListCustomer API:", error);
        return json({
            success: false,
            message: "Error occurred on api.abandonedListCustomer",
            error,
        });
    }
};
