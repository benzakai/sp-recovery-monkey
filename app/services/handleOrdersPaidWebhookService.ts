import fireStoreFetchService from "./fireStoreFetchService";
import publishMessagePubSubService from "./publishMessagePubSubService";
import { Firestore } from "@google-cloud/firestore";

export default async function handleOrdersPaidWebhookService(payload: any, shop: string) {
    try {
        const getDoc = await fireStoreFetchService("AbandonedCheckoutsData", String(payload.checkout_id));

        if (getDoc != undefined) {
            await publishMessagePubSubService("sales", JSON.stringify(payload));
        }

        const getCustomerOrders = await getAllCheckoutsOfCustomer(payload.customer.admin_graphql_api_id);
        if (getCustomerOrders?.success == true) {
            if (getCustomerOrders.data.length > 0) {
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
    const checkoutsData: any = [];
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (1000 * 60 * 60 * 48));

    try {
        const firestoreDatabase = new Firestore();
        const getCollection = firestoreDatabase.collection("AbandonedCheckoutsData");
        let getdocs = await getCollection.where("createdAt", ">=", twoDaysAgo).get();

        getdocs.forEach((doc) => {
            const docData = doc.data();
            checkoutsData.push(docData);
        });

        const data = checkoutsData.filter((item: any) => item?.payload?.UpdateData?.customer?.admin_graphql_api_id == customerId);

        return { success: true, data };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}
