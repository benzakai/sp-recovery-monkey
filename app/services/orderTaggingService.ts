import { FieldValue, Firestore } from "@google-cloud/firestore";
import prisma from "~/db.server";

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
        console.error("Invalid JSON string:", error, "sale:", str);
        return null;
    }
}


async function tagOrder(session: any, orderID: any) {
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
                        "tags": "💰 Profit by Cartkeeper"
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

async function getOrderID(session: any, orderNumber: any) {
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
            const orderID = data?.data?.orders?.nodes?.[0]?.id;
            // console.log("orderID found on getOrderID", orderID, "for this shop", session?.shop);
            // console.log('sdffddddddd', data?.extensions.cost.throttleStatus)

            if (orderID) {
                return orderID;
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
                    // console.log("sales[saleId]", sales[saleId])

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
                            const orderID = await getOrderID(session, orderNumber)
                            if (orderID) {
                                const data = await tagOrder(session, orderID)
                                if (data?.data?.orderUpdate?.userErrors?.length === 0) {
                                    console.log(`successfully added tag to this ${orderID} order of this ${doc.id} shop, saleId: ${saleId},  count:`, count)
                                    await doc.ref.update({
                                        [`${saleId}`]: FieldValue.delete()
                                    });
                                } else {
                                    console.log(`error occured on tagOrder for this store: ${doc.id} - data?.data?.orderUpdate?.userErrors:`, data?.data?.orderUpdate?.userErrors)
                                }
                            }
                            await delay(200);
                        }

                    } else {
                        console.log(`No valid Order Number for Sale ID: ${saleId} shop: ${doc.id}, sale: ${sale}`);
                    }

                }
            } else {
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
