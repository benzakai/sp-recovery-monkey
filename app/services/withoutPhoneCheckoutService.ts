import { Firestore } from "@google-cloud/firestore";
import axios from "axios";
import prisma from "~/db.server";
import fireStoreDeleteService from "./fireStoreDeleteService";
import fireStoreFetchService from "./fireStoreFetchService";
import publishMessagePubSubService from "./publishMessagePubSubService";

const AbandonedCheckoutsQuery = (checkoutId: string) => {
    return `query AbandonedCheckouts {
    abandonedCheckouts(first: 1, query: "${checkoutId}") {
        nodes {
            id
            abandonedCheckoutUrl
            customer {
                id
            }
        }
    }
}`};

const CustomerQuery = (customerId: string) => {
    return `query { 
        customer(id: "${customerId}") { 
            id 
            firstName 
            lastName 
            email 
            phone 
        }
    }`
};

const ShopQuery = `{
    shop {
        name
        email
        id
        myshopifyDomain
        primaryDomain {
            host
            id
            url
        }
    }
}`;

export default async function withoutPhoneCheckoutService() {

    try {
        const firestoreDatabase = new Firestore();
        const CheckoutsWithoutPhoneNumberCollection = firestoreDatabase.collection('CheckoutsWithoutPhoneNumber');
        const CheckoutsWithoutPhoneNumberDocuments = await CheckoutsWithoutPhoneNumberCollection.get();
        // console.log("CheckoutsWithoutPhoneNumberDocuments count", CheckoutsWithoutPhoneNumberDocuments.size);
        // console.log("CheckoutsWithoutPhoneNumberDocuments.docs", CheckoutsWithoutPhoneNumberDocuments.docs.length);

        const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

        for (const doc of CheckoutsWithoutPhoneNumberDocuments.docs) {
            const checkout = doc.data();

            // console.log("Without Phone Number Checkout Id ", checkout.checkoutId);

            if (checkout?.shop) {
                const session = await getSession(checkout?.shop);

                if (session) {
                    const getAbandonedCheckout = await publicGraphqlClient(session.shop, session.accessToken, AbandonedCheckoutsQuery(checkout?.payload?.id));
                    // console.log(checkout?.checkoutId, "getAbandonedCheckout", getAbandonedCheckout);

                    if (getAbandonedCheckout?.abandonedCheckouts?.nodes.length != 0) {
                        // console.log(checkout?.checkoutId, "Abandoned Checkout in Shopify is Present");
                        const abandonedCheckoutData = getAbandonedCheckout?.abandonedCheckouts?.nodes[0];
                        const customerId = abandonedCheckoutData?.customer?.id;
                        // console.log("customerId", customerId);

                        if (customerId) {
                            // console.log(checkout?.checkoutId, "CUSTOMER ID IS PRESENT");
                            const getCustomer = await publicGraphqlClient(session.shop, session.accessToken, CustomerQuery(customerId));
                            const customerDetails = getCustomer?.customer;
                            // console.log(checkout?.checkoutId, "customerDetails", customerDetails);

                            await publishMessagePubSubService("costumer-ID", JSON.stringify({ ...checkout, customerDetails }));

                            if (customerDetails?.phone == null) {

                                // console.log("CHECKOUT ID", checkout?.payload?.id);
                                // console.log("customerDetails?.phone", customerDetails?.phone);
                                // console.log("checkout?.payload?.phone", checkout?.payload?.phone)
                                // console.log("checkout?.payload?.billing_address?.phone", checkout?.payload?.billing_address?.phone)
                                // console.log("checkout?.payload?.shipping_address?.phone", checkout?.payload?.shipping_address?.phone);

                                if (checkout?.payload?.phone != null && checkout?.payload?.phone != undefined) {

                                    await sendDataToPubSub(checkout, session, checkout?.payload?.phone);

                                } else if (checkout?.payload?.billing_address?.phone != null && checkout?.payload?.billing_address?.phone != undefined) {

                                    await sendDataToPubSub(checkout, session, checkout?.payload?.billing_address?.phone);

                                } else if (checkout?.payload?.shipping_address?.phone != null && checkout?.payload?.shipping_address?.phone != undefined) {

                                    await sendDataToPubSub(checkout, session, checkout?.payload?.shipping_address?.phone);

                                } else {

                                    // console.log(checkout?.payload?.id, "CUSTOMER PHONE NUMBER IS ABSENT")
                                    await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);

                                }

                            } else if (customerDetails?.phone != null) {
                                await sendDataToPubSub(checkout, session, customerDetails?.phone);
                            }

                        } else {
                            // console.log(checkout?.checkoutId, "CUSTOMER ID IS NOT PRESENT");
                            await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
                        }

                    } else {
                        // console.log(checkout?.checkoutId, "Abandoned Checkout in Shopify is Absent");
                        await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
                    }

                } else {
                    // console.log(checkout?.checkoutId, "Session is NOT PRESENT in the database");
                    await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
                }
            }

            await delay(200);
        }

        // CheckoutsWithoutPhoneNumberDocuments?.forEach(async (doc) => {
        //     const checkout = doc.data();
        //     console.log("Without Phone Number Checkout Id ", checkout.checkoutId);

        //     if (checkout?.shop) {
        //         const session = await getSession(checkout?.shop);

        //         if (session) {
        //             const getAbandonedCheckout = await publicGraphqlClient(session.shop, session.accessToken, AbandonedCheckoutsQuery(checkout?.payload?.id));
        //             // console.log(checkout?.checkoutId, "getAbandonedCheckout", getAbandonedCheckout);

        //             if (getAbandonedCheckout?.abandonedCheckouts?.nodes.length != 0) {
        //                 // console.log(checkout?.checkoutId, "Abandoned Checkout in Shopify is Present");
        //                 const abandonedCheckoutData = getAbandonedCheckout?.abandonedCheckouts?.nodes[0];
        //                 const customerId = abandonedCheckoutData?.customer?.id;

        //                 if (customerId) {
        //                     // console.log(checkout?.checkoutId, "CUSTOMER ID IS PRESENT");
        //                     const getCustomer = await publicGraphqlClient(session.shop, session.accessToken, CustomerQuery(customerId));
        //                     const customerDetails = getCustomer?.customer;
        //                     // console.log(checkout?.checkoutId, "customerDetails", customerDetails);

        //                     await publishMessagePubSubService("costumer-ID", JSON.stringify({ ...checkout, customerDetails }));

        //                     if (customerDetails?.phone == null) {

        //                         if (checkout?.payload?.phone != null && checkout?.payload?.phone != undefined) {

        //                             await sendDataToPubSub(checkout, session, checkout?.payload?.phone);

        //                         } else if (checkout?.payload?.billing_address?.phone != null && checkout?.payload?.billing_address?.phone != undefined) {

        //                             await sendDataToPubSub(checkout, session, checkout?.payload?.billing_address?.phone);

        //                         } else if (checkout?.payload?.shipping_address?.phone != null && checkout?.payload?.shipping_address?.phone != undefined) {

        //                             await sendDataToPubSub(checkout, session, checkout?.payload?.shipping_address?.phone);

        //                         } else {

        //                             // console.log(checkout?.payload?.id, "CUSTOMER PHONE NUMBER IS ABSENT")
        //                             await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);

        //                         }

        //                     } else if (customerDetails?.phone != null) {
        //                         await sendDataToPubSub(checkout, session, customerDetails?.phone);
        //                     }

        //                 } else {
        //                     // console.log(checkout?.checkoutId, "CUSTOMER ID IS NOT PRESENT");
        //                     await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //                 }

        //             } else {
        //                 // console.log(checkout?.checkoutId, "Abandoned Checkout in Shopify is Absent");
        //                 await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //             }

        //         } else {
        //             // console.log(checkout?.checkoutId, "Session is NOT PRESENT in the database");
        //             await deleteOlderThan24HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //         }
        //     }
        // });
        // console.log("CheckoutsWithoutPhoneNumberDocuments count after", CheckoutsWithoutPhoneNumberDocuments.size);

        return { success: true };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}

async function getSession(shop: string) {
    try {
        const data = await prisma.session.findFirst({ where: { shop } });
        if (data) return data;
    } catch (error) {
        console.log("ERROR", error);
    }
}

async function publicGraphqlClient(shop: string, accessToken: string, QUERY: string) {
    try {
        const response = await axios({
            method: "POST",
            url: `https://${shop}/admin/api/2024-10/graphql.json`,
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken
            },
            data: { query: QUERY }
        });
        // if (response?.status > 200) console.log("response of publicGraphqlClient of withoutPhoneCheckoutService", response);

        if (response.data.data) return response.data.data;
    } catch (error) {
        console.log("ERROR on publicGraphqlClient of withoutPhoneCheckoutService", error);
    }
}


async function deleteOlderThan24HoursDocs(date: any, checkoutId: string) {
    const todaysDate = new Date().getTime();
    // const documentsDate = new Date(date).getTime() + (1 * 24 * 60 * 60 * 1000); // 24 hours
    const documentsDate = new Date(date).getTime() + (4 * 60 * 60 * 1000); // 4 hour
    const compareDates = documentsDate > todaysDate;

    if (compareDates == false) {
        await fireStoreDeleteService("CheckoutsWithoutPhoneNumber", String(checkoutId));
    }

    return { success: true };
}

async function getGreenApiData(collectionName: string, storeId: string) {
    try {
        const getDocData = await fireStoreFetchService(collectionName, storeId);

        if (getDocData) {
            return { success: true, data: getDocData };
        }

        return { success: false, message: `Connect Page Collection doesn't have the ${storeId} doc present in it` };
    } catch (error) {
        console.log(`error`, error);
        return { success: false };
    }
}

async function getShopDomain(shop: string, accessToken: string) {
    try {
        const response = await publicGraphqlClient(shop, accessToken, ShopQuery);
        if (response?.shop) {
            return { success: true, data: response?.shop?.primaryDomain?.host }
        }
    } catch (error) {
        console.log("error", error);
        return { success: false };
    }
}

async function sendDataToPubSub(checkout: any, session: any, phone: any) {
    console.log("PHONE NUMBER", phone);
    try {
        const STORE_ID = checkout?.shop;
        const UpdateData = checkout?.payload;
        const SHOP_DOMAIN = await getShopDomain(session.shop, session.accessToken);
        const Green_API_ID = await getGreenApiData("ConnectPagedata", checkout?.shop);

        const newObj: any = { STORE_ID, UpdateData };
        newObj["UpdateData"]["phone"] = phone;

        if (SHOP_DOMAIN?.success == true) newObj["SHOP_DOMAIN"] = SHOP_DOMAIN?.data;
        if (Green_API_ID?.success == true) newObj["Green_API_ID"] = Green_API_ID?.data;

        const recentOrders = await fetchOrders(session.shop, session.accessToken);
        // console.log("recentOrders", recentOrders);
        const orderExists = recentOrders.some((order: any) => order.checkout_id == checkout?.payload?.id);
        // console.log("orderExists", orderExists);

        if (orderExists) {
            await fireStoreDeleteService("CheckoutsWithoutPhoneNumber", String(checkout?.payload?.id));
            // console.log("ORDER ALREADY EXISTS FOR THIS CHECKOUT. NOT SENDING TO PUB/SUB");
        } else {
            await publishMessagePubSubService("NewAbandonedCheckout", JSON.stringify(newObj));
            await fireStoreDeleteService("CheckoutsWithoutPhoneNumber", String(checkout?.payload?.id));
            // console.log(checkout?.payload?.id, "CUSTOMER PHONE NUMBER IS PRESENT SEND DATA TO PUBSUB")
        }

        return { success: true };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}

async function fetchOrders(shopName: string, token: string) {

    try {
        const response = await fetch(
            `https://${shopName}/admin/api/2024-10/orders.json?status=any`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": token,
                },
            }
        );
        // if (response?.status > 200) console.log("response of fetching orders from Shopify from withoutPhoneCheckoutService:", response);

        const responseData = await response.json();
        // console.log("responseData?.orders", responseData?.orders);
        return responseData?.orders;
    } catch (error) {
        console.log("Error fetching orders from Shopify from withoutPhoneCheckoutService:", error);
        return [];
    }
}