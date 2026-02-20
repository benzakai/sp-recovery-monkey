import fireStoreFetchService from "./fireStoreFetchService";
import publishMessagePubSubService from "./publishMessagePubSubService";
import { Firestore } from "@google-cloud/firestore";

export default async function handleOrdersPaidWebhookService(payload: any, shop: string) {
    try {
        const getDoc = await fireStoreFetchService("AbandonedCheckoutsData", String(payload.checkout_id));
        console.log("before publishing to first sales topic for checkout:", payload.checkout_id, "store:", shop);
        if (getDoc != undefined) {
            console.log("publishing to first sales topic for checkout:", payload.checkout_id, "store:", shop);
            await publishMessagePubSubService("sales", JSON.stringify(payload));
        }

        const getCustomerOrders: any = await getAllCheckoutsOfCustomer(payload.customer.admin_graphql_api_id);
        if (getCustomerOrders?.success == true) {
            if (getCustomerOrders.data.length > 0) {
                console.log("publishing to second sales topic for checkout:", payload.checkout_id, "store:", shop);
                await publishMessagePubSubService("sales", JSON.stringify({
                    storeId: shop,
                    customerId: payload.customer.admin_graphql_api_id,
                    orders: getCustomerOrders.data
                }));
            } else {
                console.log("No Orders Found for Customer", payload.customer.admin_graphql_api_id)
            }
        }

    } catch (error) {
        console.log("handleOrdersPaidWebhookService error", error);
    }
}

async function getAllCheckoutsOfCustomer(customerId: string) {
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (1000 * 60 * 60 * 48));

    try {
        if (!customerId) {
            // console.log("No customerId provided on getAllCheckoutsOfCustomer function");
            return { success: false, data: [] };
        }

        const firestoreDatabase = new Firestore();
        const getCollection = firestoreDatabase.collection("AbandonedCheckoutsData");

        const snapshot = await getCollection
            .where("customerId", "==", customerId)
            .where("createdAt", ">=", twoDaysAgo)
            .get();

        // console.log("getAllCheckoutsOfCustomer snapshot.size:", snapshot.size);

        const data = snapshot.docs.map((doc) => doc.data());
        return { success: true, data };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}