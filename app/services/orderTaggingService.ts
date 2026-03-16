import { FieldValue, Firestore } from "@google-cloud/firestore";
import prisma from "~/db.server";
import fireStoreCreateService from "./fireStoreCreateService";

const firestoreDatabase = new Firestore();

/**
 * Standardized logging helper for Order Tagging
 */
const logAction = (level: 'INFO' | 'ERROR' | 'SUCCESS', shop: string, message: string, extra: any = "") => {
    const timestamp = new Date().toISOString();
    const prefix = `[ORDERTAGGING][${level}][${shop}]`;
    console.log(`${prefix} - ${message}`, extra);
};

async function getSession(shop: string) {
    try {
        const data = await prisma.session.findFirst({ where: { shop } });
        if (data) return data;
    } catch (error) {
        logAction('ERROR', shop, `Failed to get session from DB`, error);
    }
}

function cleanAndFormatData(str: any) {
    const newstr = str.replace(/,,+/g, ",");
    try {
        return JSON.parse(newstr);
    } catch (error) {
        return null;
    }
}

async function saveFailedSale(docId: string, saleId: string, saleData: any, reason: string) {
    try {
        const failedSale = {
            [saleId]: JSON.stringify({
                ...(saleData ? saleData : { noDataReason: "The order data format is invalid." }),
                failureReason: reason,
            }),
        };

        await fireStoreCreateService("SalesTaggingFailedOrders", docId, failedSale, { merge: true });
        logAction('INFO', docId, `Sale ${saleId} recorded in SalesTaggingFailedOrders. Reason: ${reason}`);
    } catch (error) {
        logAction('ERROR', docId, `Critical failure saving failed sale record for ${saleId}`, error);
    }
}

async function tagOrder(session: any, orderID: any, previousTags: any) {
    const shop = session?.shop || "Unknown";
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
            return await response.json();
        } else {
            logAction('ERROR', shop, "Leaving tagOrder: Session data shop is missing");
        }
    } catch (error) {
        logAction('ERROR', shop, `Exception in tagOrder API call`, error);
    }
}

async function getOrderData(session: any, orderNumber: any) {
    const shop = session?.shop || "Unknown";
    try {
        if (session?.shop && orderNumber) {
            const url = `https://${session.shop}/admin/api/2025-01/graphql.json`;
            const headers = {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': session.accessToken
            };

            const body = JSON.stringify({
                query: `query { orders(first: 1, query:"name:${orderNumber}") { nodes { id tags } } }`
            });

            const response = await fetch(url, { method: 'POST', headers, body });
            const data = await response.json();
            const orderData = data?.data?.orders?.nodes?.[0];

            if (!orderData) {
                logAction('INFO', shop, `Order name ${orderNumber} not found in Shopify`);
            }
            return orderData;
        } else {
            logAction('ERROR', shop, `Leaving getOrderData: Missing shop or orderNumber (${orderNumber})`);
        }
    } catch (error) {
        logAction('ERROR', shop, `Exception in getOrderData API call`, error);
    }
}

export default async function orderTaggingService() {
    logAction('INFO', 'SYSTEM', "orderTaggingService function STARTED");
    try {
        const salesTaggingCollection = firestoreDatabase.collection('SalesTagging');
        const salesTaggingCollectionDocuments = await salesTaggingCollection.get();
        
        logAction('INFO', 'SYSTEM', `Found ${salesTaggingCollectionDocuments.size} stores to process`);

        const delay = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
        let count = 0;

        for (const doc of salesTaggingCollectionDocuments.docs) {
            const shop = doc.id;
            const sales = doc.data();
    
            if (shop === ".myshopify.com") continue;
            
            count++;
            logAction('INFO', shop, `Processing store [${count}/${salesTaggingCollectionDocuments.size}]`);

            const session = await getSession(shop);

            if (session) {
                for (const saleId in sales) {
                    let sale;
                    try {
                        sale = cleanAndFormatData(sales[saleId]);
                    } catch (error) {
                        logAction('ERROR', shop, `JSON parsing error for Sale ID: ${saleId}`);
                        continue;
                    }

                    if (sale && sale["Order Number"]) {
                        const orderNumber = sale["Order Number"];
                        const gotOrder = await getOrderData(session, orderNumber);
                        const orderID = gotOrder?.id;
                        const previousTags = gotOrder?.tags || [];

                        if (orderID) {
                            const data = await tagOrder(session, orderID, previousTags);
                            if (data?.data?.orderUpdate?.userErrors?.length === 0) {
                                logAction('SUCCESS', shop, `Tagged order ${orderID} for sale ${saleId}`);
                                await doc.ref.update({
                                    [`${saleId}`]: FieldValue.delete()
                                });
                            } else {
                                const errors = data?.data?.orderUpdate?.userErrors;
                                logAction('ERROR', shop, `Shopify UserErrors for sale ${saleId}`, errors);
                                await saveFailedSale(shop, saleId, sale, "Problem during tag adding API");
                            }
                        } else {
                            await saveFailedSale(shop, saleId, sale, "Order not found on store matching Order Number");
                        }
                        await delay(200);
                    } else {
                        logAction('ERROR', shop, `Invalid data/missing Order Number for Sale ID: ${saleId}`);
                        await saveFailedSale(shop, saleId, sale, "No valid Order Number found or data format is invalid");
                    }
                }
            } else {
                logAction('ERROR', shop, "Session not found - Moving sales to Failed collection (likely uninstalled)");
                const batch = firestoreDatabase.batch();
                const failedCollection = firestoreDatabase.collection("SalesTaggingFailedOrders").doc(shop);
                
                for (const saleId in sales) {
                    const sale = cleanAndFormatData(sales[saleId]);
                    batch.set(failedCollection, {
                        [saleId]: JSON.stringify({
                            ...(sale ? sale : { noDataReason: "The order data format is invalid." }),
                            failureReason: "No session found — store may have uninstalled the app",
                        }),
                    }, { merge: true });
                }
                await batch.commit();
            }
        }
        logAction('INFO', 'SYSTEM', "orderTaggingService function FINISHED");
        return { success: true };
    } catch (error) {
        logAction('ERROR', 'SYSTEM', "Global catch in orderTaggingService", error);
        return { success: false };
    }
}