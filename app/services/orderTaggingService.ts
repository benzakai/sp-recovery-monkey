import { FieldValue, Firestore } from "@google-cloud/firestore";
import prisma from "~/db.server";
import fireStoreCreateService from "./fireStoreCreateService";

const firestoreDatabase = new Firestore();

async function getSession(shop: string) {
    try {
        const data = await prisma.session.findFirst({ where: { shop } });
        if (data) return data;
    } catch (error) {
        console.log(`ERROR on getSession from orderTaggingService on this store ${shop}`, error);
    }
}

function cleanAndFormatData(str: any) {
    const newstr = str.replace(/,,+/g, ",")
    try {
        const data = JSON.parse(newstr);
        // console.log("data", data)
        return data
    } catch (error) {
        // console.error("Invalid JSON string:", error, "sale:", str);
        return null;
    }
}

async function saveFailedSale(docId: string, saleId: string, saleData: any, reason: string) {
    const failedSale = {
        [saleId]: JSON.stringify({
            ...(saleData ? saleData : { noDataReason: "The order data format is invalid." }),
            failureReason: reason,
        }),
    };

    await fireStoreCreateService("SalesTaggingFailedOrders", docId, failedSale, { merge: true });
}



async function tagOrder(session: any, orderID: any, previousTags: any) {
    // console.log("orderID on tagOder", orderID)
    try {
        if (session?.shop) {
            const url = `https://${session.shop}/admin/api/2025-01/graphql.json`;
            const accessToken = session.accessToken;

            const headers = {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            };

            const body = JSON.stringify({
                query: `
            mutation updateOrderMetafields($input: OrderInput!) { 
              orderUpdate(input: $input) { 
                order { 
                  id 
                  metafields(first: 3) { 
                    edges { 
                      node { 
                        id 
                        namespace 
                        key 
                        value 
                      } 
                    } 
                  } 
                } 
                userErrors { 
                  message 
                  field 
                } 
              } 
            }`,
                variables: {
                    "input": {
                        "id": orderID,
                        "tags": [...previousTags, "💰 Profit by Cartkeeper"]
                    }
                }
            });
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            })

            const data = await response.json()
            // console.log("data got from tagOrder", data)
            return data
        } else {
            console.log("leaving tagOrder function without adding tag becasue session data shop is missing, session:", session);
        }
    } catch (error) {
        console.log(`error occured on tagOrder from orderTaggingService for this store ${session?.shop}, error:`, error)
    }
}

async function getOrderData(session: any, orderNumber: any) {
    // console.log("orderNumber from getOrderID", orderNumber);
    // console.log("session.shop", session.shop)
    // console.log("session.accessToken", session.accessToken)
    try {
        if (session?.shop && orderNumber) {
            const url = `https://${session.shop}/admin/api/2025-01/graphql.json`;
            const accessToken = session.accessToken;

            const headers = {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            };

            const body = JSON.stringify({
                query: `
                    query {
                        orders(first: 10, query:"name:${orderNumber}") {
                            nodes{
                                id
                                tags
                            }
                        }
                    }`
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });

            const data = await response.json();
            // console.log("data of orderID", data);
            const orderData = data?.data?.orders?.nodes?.[0];
            // console.log("orderID found on getOrderID", orderID, "for this shop", session?.shop);
            // console.log('sdffddddddd', data?.extensions.cost.throttleStatus)

            if (orderData) {
                return orderData;
            } else {
                return null;
            }

        } else {
            console.log("leaving getOrderID function becasue session data shop or order number is missing, session:", session, "orderNumber:", orderNumber);
        }
    } catch (error) {
        console.log(`error occured on getOrderID from orderTaggingService for this store ${session?.shop}, error:`, error)
    }
}

export default async function orderTaggingService() {
    console.log("orderTaggingService function STARTED!")
    try {
        const salesTaggingCollection = firestoreDatabase.collection('SalesTagging');
        const salesTaggingCollectionDocuments = await salesTaggingCollection.get();
        console.log("salesTaggingCollectionDocuments count", salesTaggingCollectionDocuments.size);

        const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        let count = 0
        for (const doc of salesTaggingCollectionDocuments.docs) {
            const sales = doc.data();
            const session = await getSession(doc.id);
            count++
            // console.log("session", session);
            if (session) {
                // console.log("sales data..........", sales)
                for (const saleId in sales) {


                    let sale;
                    try {
                        sale = cleanAndFormatData(sales[saleId]);
                    } catch (error) {
                        console.log(`JSON parsing error for Sale ID: ${saleId} in shop: ${doc.id}`, count);
                        continue;
                    }

                    // console.log("orderTaggingService sale", sale);

                    if (sale && sale["Order Number"]) {
                        const orderNumber = sale["Order Number"];

                        if (orderNumber) {
                            // console.log("saleId", saleId)
                            // console.log("continuing the process because session found!", session)
                            const gotOrder = await getOrderData(session, orderNumber)
                            const orderID = gotOrder?.id;
                            const previousTags = gotOrder?.tags ? gotOrder?.tags : [];
                            // console.log("previousTags", previousTags)
                            if (orderID) {
                                const data = await tagOrder(session, orderID, previousTags)
                                if (data?.data?.orderUpdate?.userErrors?.length === 0) {
                                    console.log(`successfully added tag to this ${orderID} order of this ${doc.id} shop, saleId: ${saleId},  count:`, count)
                                    await doc.ref.update({
                                        [`${saleId}`]: FieldValue.delete()
                                    });
                                } else {
                                    await saveFailedSale(doc.id, saleId, sale, "Problem during tag adding API");
                                    console.log(`error occured on tagOrder for this store: ${doc.id} - data?.data?.orderUpdate?.userErrors:`, data?.data?.orderUpdate?.userErrors)
                                }
                            } else {
                                await saveFailedSale(doc.id, saleId, sale, "Order not found on the store matching the Order Number");
                            }
                            await delay(200);
                        }
                    } else {
                        await saveFailedSale(doc.id, saleId, sale, "No valid Order Number found or data format is invalid");
                        console.log(`No valid Order Number for Sale ID: ${saleId} shop: ${doc.id}, sale: ${sale}`);
                    }

                }
            } else {
                const batch = firestoreDatabase.batch();
                const failedCollection = firestoreDatabase.collection("SalesTaggingFailedOrders").doc(doc.id);
                for (const saleId in sales) {
                    const sale = cleanAndFormatData(sales[saleId]);
                    batch.set(
                        failedCollection,
                        {
                            [saleId]: JSON.stringify({
                                ...(sale ? sale : { noDataReason: "The order data format is invalid." }),
                                failureReason: "No session found — store may have uninstalled the app",
                            }),
                        },
                        { merge: true }
                    );
                }
                await batch.commit();
                // console.log(`All failed sales batch written for store ${doc.id}`);
                continue;
                // console.log("Session not found on orderTaggingService function for this store '",doc.id,"' so not moving forward with this store data.");
            }
        }
        console.log("================ orderTaggingService function STOPPED! ==================")
        return { success: true };
    } catch (error) {
        console.log("ERROR on orderTaggingService", error);
        return { success: false };
    }
}
