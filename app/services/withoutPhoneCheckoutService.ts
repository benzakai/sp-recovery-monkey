import { Firestore, FieldValue } from "@google-cloud/firestore";
import axios from "axios";
import prisma from "~/db.server";
import fireStoreFetchService from "./fireStoreFetchService";
import publishMessagePubSubService from "./publishMessagePubSubService";

const logger = {
  info: (message: string, data?: any) => {
    // console.log(`[INFO] withoutPhoneCheckoutService [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    // console.warn(`[WARN] withoutPhoneCheckoutService [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(`[ERROR] withoutPhoneCheckoutService [${new Date().toISOString()}] ${message}`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      additionalData: data ? JSON.stringify(data) : ''
    });
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
    //   console.log(`[DEBUG] withoutPhoneCheckoutService [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
    }
  }
};

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

const firestoreDatabase = new Firestore();

export default async function withoutPhoneCheckoutService() {
    logger.info(`Cron Job Started`);
    try {
        const shopsCollection = firestoreDatabase.collection("CheckoutsWithoutPhoneNumberUpdated");
        const shopsSnapshot = await shopsCollection.get();
        logger.info(`Found shops in Firestore`, { totalShops: shopsSnapshot.size });

        const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

        for (const shopDoc of shopsSnapshot.docs) {
            const shopId = shopDoc.id;
            const checkoutsRef = shopDoc.ref.collection("checkouts");
            const checkoutsSnapshot = await checkoutsRef.get();

            logger.info(`Processing shop with checkouts`, { shopId, checkoutCount: checkoutsSnapshot.size });
            const session = await getSession(shopId);
            // console.log("session", session);

            for (const checkoutDoc of checkoutsSnapshot.docs) {
                const checkout = checkoutDoc.data();
                logger.debug(`Processing checkout document`, { checkoutId: checkout?.checkoutId, storeId: checkout?.storeId });
                
                if (checkout?.storeId) {
                    if (session) {
                        logger.debug(`Session found, fetching abandoned checkout data`, { checkoutId: checkout?.checkoutId, shop: session.shop });

                        const getAbandonedCheckout = await publicGraphqlClient(session.shop, session.accessToken, AbandonedCheckoutsQuery(checkout?.payload?.id));

                        if (getAbandonedCheckout?.abandonedCheckouts?.nodes.length != 0) {
                            logger.debug(`Abandoned checkout exists in Shopify`, { checkoutId: checkout?.checkoutId });
                            const abandonedCheckoutData = getAbandonedCheckout?.abandonedCheckouts?.nodes[0];
                            const customerId = abandonedCheckoutData?.customer?.id;
                            logger.debug(`Retrieved customer ID from abandoned checkout`, { checkoutId: checkout?.checkoutId, customerId });

                            if (customerId) {
                                logger.debug(`Fetching customer details`, { checkoutId: checkout?.checkoutId, customerId });
                                const getCustomer = await publicGraphqlClient(session.shop, session.accessToken, CustomerQuery(customerId));
                                const customerDetails = getCustomer?.customer;
                                logger.debug(`Retrieved customer details`, { checkoutId: checkout?.checkoutId, hasPhone: !!customerDetails?.phone });

                                await publishMessagePubSubService("costumer-ID", JSON.stringify({ ...checkout, customerDetails }));

                                if (customerDetails?.phone == null) {
                                    logger.debug(`Customer phone is null, checking checkout for phone numbers`, { checkoutId: checkout?.checkoutId });

                                    if (checkout?.payload?.phone != null && checkout?.payload?.phone != undefined) {
                                        logger.info(`Found phone in checkout payload`, { checkoutId: checkout?.checkoutId });
                                        await sendDataToPubSub(checkout, session, checkout?.payload?.phone);

                                    } else if (checkout?.payload?.billing_address?.phone != null && checkout?.payload?.billing_address?.phone != undefined) {
                                        logger.info(`Found phone in billing address`, { checkoutId: checkout?.checkoutId });
                                        await sendDataToPubSub(checkout, session, checkout?.payload?.billing_address?.phone);

                                    } else if (checkout?.payload?.shipping_address?.phone != null && checkout?.payload?.shipping_address?.phone != undefined) {
                                        logger.info(`Found phone in shipping address`, { checkoutId: checkout?.checkoutId });
                                        await sendDataToPubSub(checkout, session, checkout?.payload?.shipping_address?.phone);

                                    } else {
                                        logger.warn(`No phone number found in any source`, { checkoutId: checkout?.checkoutId });
                                        await deleteOlderThan4HoursDocs(checkout?.createdAt.toDate(), checkout?.payload?.id, session?.shop);
                                    }

                                } else if (customerDetails?.phone != null) {
                                    logger.info(`Using customer details phone`, { checkoutId: checkout?.checkoutId });
                                    await sendDataToPubSub(checkout, session, customerDetails?.phone);
                                }

                            } else {
                                logger.warn(`No customer ID found, deleting checkout`, { checkoutId: checkout?.checkoutId });
                                await deleteOlderThan4HoursDocs(checkout?.createdAt.toDate(), checkout?.payload?.id, session?.shop);
                            }

                        } else {
                            logger.warn(`Abandoned checkout not found in Shopify, deleting from Firestore`, { checkoutId: checkout?.checkoutId });
                            await deleteOlderThan4HoursDocs(checkout?.createdAt.toDate(), checkout?.payload?.id, session?.shop);
                        }

                    } else {
                        logger.warn(`Session not found in database, deleting checkout`, { storeId: checkout?.storeId, checkoutId: checkout?.checkoutId });
                        await deleteOlderThan4HoursDocs(checkout?.createdAt.toDate(), checkout?.payload?.id, checkout?.storeId);
                    }
                }

                await delay(200);
            }

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
        //                             await deleteOlderThan4HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);

        //                         }

        //                     } else if (customerDetails?.phone != null) {
        //                         await sendDataToPubSub(checkout, session, customerDetails?.phone);
        //                     }

        //                 } else {
        //                     // console.log(checkout?.checkoutId, "CUSTOMER ID IS NOT PRESENT");
        //                     await deleteOlderThan4HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //                 }

        //             } else {
        //                 // console.log(checkout?.checkoutId, "Abandoned Checkout in Shopify is Absent");
        //                 await deleteOlderThan4HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //             }

        //         } else {
        //             // console.log(checkout?.checkoutId, "Session is NOT PRESENT in the database");
        //             await deleteOlderThan4HoursDocs(checkout?.updatedAt.toDate(), checkout?.payload?.id);
        //         }
        //     }
        // });
        // console.log("CheckoutsWithoutPhoneNumberDocuments count after", CheckoutsWithoutPhoneNumberDocuments.size);

        logger.info(`All shops processed successfully`);
        return { success: true };
    } catch (error) {
        logger.error(`Critical error in withoutPhoneCheckout cron job`, error);
        return { success: false };
    } finally {
        logger.info(`Cron Job Ended`);
    }
}

async function getSession(shop: string) {
    logger.debug(`Fetching session from database`, { shop });
    try {
        const data = await prisma.session.findFirst({ where: { shop } });
        if (data) {
            logger.debug(`Session found`, { shop });
            return data;
        } else {
            logger.warn(`Session not found in database`, { shop });
            return null;
        }
    } catch (error) {
        logger.error(`Error fetching session`, error, { shop });
        return null;
    }
}

async function publicGraphqlClient(shop: string, accessToken: string, QUERY: string) {
    logger.debug(`Executing GraphQL query against Shopify`, { shop });
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

        if (response.data.errors) {
            logger.error(`GraphQL errors in response`, new Error(JSON.stringify(response.data.errors)), { shop });
            return null;
        }

        if (response.data.data) {
            logger.debug(`GraphQL query executed successfully`, { shop });
            return response.data.data;
        } else {
            logger.warn(`No data returned from GraphQL query`, { shop });
            return null;
        }
    } catch (error) {
        logger.error(`Error executing GraphQL query`, error, { shop });
        return null;
    }
}


async function deleteOlderThan4HoursDocs(date: any, checkoutId: string, shop: string) {
    const todaysDate = new Date().getTime();
    const documentsDate = new Date(date).getTime() + (4 * 60 * 60 * 1000); // 4 hour
    const compareDates = documentsDate > todaysDate;

    logger.debug(`Checking if checkout should be deleted`, { checkoutId, shop, docAge: new Date(todaysDate - documentsDate).getMinutes(), shouldDelete: !compareDates });

    if (compareDates == false) {
        try {
            const checkoutRef = firestoreDatabase
                .collection("CheckoutsWithoutPhoneNumberUpdated")
                .doc(shop)
                .collection("checkouts")
                .doc(checkoutId.toString());

            await checkoutRef.delete();
            logger.debug(`Deleted old checkout from Firestore`, { checkoutId, shop });
        } catch (error) {
            logger.error(`Error deleting checkout from Firestore`, error, { checkoutId, shop });
        }
    } else {
        logger.debug(`Checkout is within 4-hour window, not deleting`, { checkoutId, shop });
    }

    return { success: true };
}

async function getGreenApiData(collectionName: string, storeId: string) {
    logger.debug(`Fetching Green API data`, { collectionName, storeId });
    try {
        const getDocData = await fireStoreFetchService(collectionName, storeId);

        if (getDocData) {
            logger.debug(`Green API data found`, { collectionName, storeId });
            return { success: true, data: getDocData };
        }

        logger.warn(`Green API data document not found`, { collectionName, storeId });
        return { success: false, message: `Connect Page Collection doesn't have the ${storeId} doc present in it` };
    } catch (error) {
        logger.error(`Error fetching Green API data`, error, { collectionName, storeId });
        return { success: false };
    }
}

async function getShopDomain(shop: string, accessToken: string) {
    logger.debug(`Fetching shop domain`, { shop });
    try {
        const response = await publicGraphqlClient(shop, accessToken, ShopQuery);
        if (response?.shop) {
            const domain = response?.shop?.primaryDomain?.host;
            logger.debug(`Shop domain retrieved`, { shop, domain });
            return { success: true, data: domain }
        } else {
            logger.warn(`Shop data not found in response`, { shop });
            return { success: false };
        }
    } catch (error) {
        logger.error(`Error fetching shop domain`, error, { shop });
        return { success: false };
    }
}

async function sendDataToPubSub(checkout: any, session: any, phone: any) {
    logger.info(`Preparing to send checkout data to PubSub`, { checkoutId: checkout?.payload?.id, shop: session.shop, phone });
    try {
        const STORE_ID = checkout?.storeId;
        const UpdateData = checkout?.payload;
        logger.debug(`Fetching shop domain and API data`, { shop: session.shop });
        
        const SHOP_DOMAIN = await getShopDomain(session.shop, session.accessToken);
        const Green_API_ID = await getGreenApiData("ConnectPagedata", STORE_ID);

        const newObj: any = { STORE_ID, UpdateData };
        newObj["UpdateData"]["phone"] = phone;
        if (SHOP_DOMAIN?.success == true) newObj["SHOP_DOMAIN"] = SHOP_DOMAIN?.data;
        if (Green_API_ID?.success == true) newObj["Green_API_ID"] = Green_API_ID?.data;
        newObj["phonenumberfoundby"] = "addbybz"

        logger.debug(`Fetching recent orders to check if order exists`, { shop: session.shop });
        const recentOrders = await fetchOrders(session.shop, session.accessToken);
        const orderExists = recentOrders.some((order: any) => order.checkout_id == checkout?.payload?.id);
        logger.info(`Order existence check completed`, { checkoutId: checkout?.payload?.id, orderExists });
        
        if (orderExists) {
            logger.info(`Order already exists for this checkout, deleting without sending to PubSub`, { checkoutId: checkout?.payload?.id, shop: session.shop });
            const checkoutRef = firestoreDatabase
                .collection("CheckoutsWithoutPhoneNumberUpdated")
                .doc(session.shop)
                .collection("checkouts")
                .doc(checkout?.payload?.id.toString());

            await checkoutRef.delete();
        } else {
            logger.info(`Publishing checkout to PubSub`, { checkoutId: checkout?.payload?.id, topic: "checkoutWithoutPhonenumber" });
            await publishMessagePubSubService("checkoutWithoutPhonenumber", JSON.stringify(newObj));
            
            const checkoutRef = firestoreDatabase
                .collection("CheckoutsWithoutPhoneNumberUpdated")
                .doc(session.shop)
                .collection("checkouts")
                .doc(checkout?.payload?.id.toString());

            await checkoutRef.delete();
            logger.info(`Checkout published and deleted from Firestore`, { checkoutId: checkout?.payload?.id });
        }

        return { success: true };
    } catch (error) {
        logger.error(`Error sending data to PubSub`, error, { checkoutId: checkout?.payload?.id, shop: session.shop });
        return { success: false };
    }
}

async function fetchOrders(shopName: string, token: string) {
    logger.debug(`Fetching orders from Shopify`, { shop: shopName });
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

        if (!response.ok) {
            logger.error(`Failed to fetch orders - HTTP error`, new Error(`HTTP ${response.status}`), { shop: shopName });
            return [];
        }

        const responseData = await response.json();
        const orderCount = responseData?.orders?.length || 0;
        logger.debug(`Successfully fetched orders from Shopify`, { shop: shopName, count: orderCount });
        return responseData?.orders || [];
    } catch (error) {
        logger.error(`Error fetching orders from Shopify`, error, { shop: shopName });
        return [];
    }
}