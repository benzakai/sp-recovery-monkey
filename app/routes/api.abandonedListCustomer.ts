import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Firestore } from "@google-cloud/firestore";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const firestoreDatabase = new Firestore();
    try {
        const checkoutCollection = firestoreDatabase.collection('checkout');
        const doc = await checkoutCollection.doc(session.shop).get();
        // console.log("doc", doc.data());
        const data = doc.data();
        let abandonedListCustomer: any[] = [];
        if (data) {
            abandonedListCustomer = Object.entries(data).map(([key, value]) => JSON.parse(value));
        }
        // console.log("abandonedListCustomer", abandonedListCustomer);
        return json({ success: true, abandonedListCustomer });
    } catch (error) {
        console.log("Error on api.abandonedListCustomer:", error);
        return json({ success: false, error: error, message: 'Error occurred on api.abandonedListCustomer' });
    }
};