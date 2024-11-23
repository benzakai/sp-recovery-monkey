import { Firestore } from "@google-cloud/firestore";
import db from '../db.server'
import publishMessagePubSubService from "./publishMessagePubSubService";
import axios from "axios";
import fireStoreDeleteService from "./fireStoreDeleteService";
import fireStoreCreateService from "./fireStoreCreateService";
import fireStoreFetchService from "./fireStoreFetchService";

const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');

const getFirestoreData = async (collectionName: string, storeId: string) => {
  try {
    const getDocData = await fireStoreFetchService(collectionName, storeId);

    if (getDocData) {
      return { success: true, data: getDocData };
    }

    return { success: false, message: `Connect Page Collection doesn't have the ${storeId} doc present in it` };
  } catch (error) {
    console.log(`error`, error);
    throw new Error("Failed to retrieve Firestore data");
  }
}

const handleOldCheckout = async (checkout: any, shop: string, token: string, session: any) => {
  const checkoutId = checkout.checkoutId;

  try {

    const recentOrders = await fetchOrders(shop, token);
    const shopDomain = await getShopDomain(shop, token);
    const orderExists = recentOrders.some((order: any) => order.checkout_id === checkoutId);

    if (orderExists) {
      await fireStoreDeleteService("users", String(checkoutId));
      await fireStoreDeleteService("checkoutUpdateData", String(checkoutId));
    } else {
      console.log(`Checkout ${checkoutId} is abandoned.`);

      const checkoutUpdateDoc = await fireStoreFetchService("checkoutUpdateData", checkoutId.toString());

      if (checkoutUpdateDoc) {
        const getGreenAPIData = await getFirestoreData("ConnectPagedata", shop);

        let objj: any = {};
        objj = checkoutUpdateDoc;
        
        objj["SHOP DOMAIN"] = shopDomain;

        if (getGreenAPIData.success == true) {

          objj["Green API ID"] = getGreenAPIData.data;
          const HasToSend = await checkMatching(session);

          if (HasToSend && HasToSend?.status == true) {
            await sendDataToPubSub(objj);
            await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
            await setsubscriptionAbandonedCarts(objj);
          } else if (HasToSend && HasToSend?.status == false) {
            console.log('data not send to pubsub----------------------');
          } else if (!HasToSend) {
            await sendDataToPubSub(objj);
            await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
            await setsubscriptionAbandonedCarts(objj);
          }


        } else {
          const HasToSend = await checkMatching(session);
          if (HasToSend && HasToSend?.status == true) {
            await sendDataToPubSub(objj);
            await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
            await setsubscriptionAbandonedCarts(objj);
          } else if (HasToSend && HasToSend?.status == false) {
            console.log('data not send to pubsub----------------------');
          } else if (!HasToSend) {
            await sendDataToPubSub(objj);
            await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
            await setsubscriptionAbandonedCarts(objj);
          }

        }

      }

      await fireStoreDeleteService("users", String(checkoutId));
      await fireStoreDeleteService("checkoutUpdateData", String(checkoutId));
      console.log("Cron Job Ended");
    }
  } catch (error) {
    console.error(`Error handling checkout ${checkoutId}:`, error);
  }
}

const sendDataToPubSub = async (message: any) => {
  const messageJson = JSON.stringify(message);
  const topicName = "NewAbandonedCheckout";

  try {
    await publishMessagePubSubService("NewAbandonedCheckout", JSON.stringify(message));

  } catch (err) {
    console.error("Error publishing message:", err);
  }
}

const fetchOrders = async (shopName: string, token: string) => {
  const lastTenMinuteTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    const response = await fetch(
      `https://${shopName}/admin/api/2024-10/orders.json?status=any&created_at_min=${lastTenMinuteTime}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
      }
    );

    const responseData = await response.json();
    return responseData?.orders;
  } catch (error) {
    console.log("Error fetching orders from Shopify:", error);
    return [];
  }
}

const getShopDomain = async (shopName: string, token: string) => {
  try {
    const response = await fetch(
      `https://${shopName}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: `{
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
                }`
        })
      }
    );

    const responseData = await response.json();
    return responseData.data?.shop?.primaryDomain?.host;
  } catch (error) {
    console.log("Error fetching domain from Shopify:", error);
    return '';
  }
}

export const sendDataFromWebhooks = async () => {
  console.log("Cron Job Started");

  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oldCheckoutsQuerySnapshot = await checkoutCollection.where("createdAt", "<=", tenMinutesAgo).get();

    oldCheckoutsQuerySnapshot?.forEach(async (doc) => {
      const checkout = doc.data();
      const session = await db.session.findFirst({ where: { shop: checkout.storeId } });

      if (session) {
        const hasValidSubscription = await storeSubscriptionActive(session.shop);

        if (hasValidSubscription?.success == true) {
          await handleOldCheckout(checkout, session.shop, session.accessToken, session);
        } else {
          console.log("Cron Job Stopped because the Store does not have Active Subscription.");
        }

      } else {
        console.log(`Session is Not Found for the ${checkout.storeId} in the Database, hence code not moving forward`)
        console.log("Cron Job Ended");
      }

    });

  } catch (error) {
    console.error("Error fetching old checkouts:", error);
  }

  console.log("Cron Job Ended");
}

export const setAppInstalledDate = async (session: any, data: any) => {

  await fireStoreCreateService("AppInstalledDate", session.shop, data, { merge: true })
}

export const getAppInstalledDate = async (session: any) => {
  const doc = await fireStoreFetchService("AppInstalledDate", session.shop);

  if (!doc) {
    return null;
  } else {
    return doc;
  }
}

export const getSubscriptionsData = async (session: any) => {
  const doc = await fireStoreFetchService("subscriptions", session.shop);

  if (!doc) {
    return null;
  } else {
    return doc;
  }
}

const setsubscriptionAbandonedCarts = async (data: any) => {
  const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
  await collection.add(data);
}

export const checkMatching = async (session: any) => {
  const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
  const subscriptionQuerySnapshot = await collection.where("STORE_ID", "==", session.shop).get();

  if (subscriptionQuerySnapshot.empty) {
    return { data: 'No subscriptionAbandonedCarts found', status: true };
  }
  const recoveredCarts = await getAbandonedCarts(session);
  
  for (const doc of subscriptionQuerySnapshot.docs) {
    const docData = doc.data();
    const checkoutId = docData?.UpdateData?.id || docData?.checkoutId || docData?.id || null;

    if (recoveredCarts?.length > 0) {
      const matchedCart = recoveredCarts.find(c => c.id == checkoutId);
      
      if (matchedCart) {

        let limit = 0;
        const subscriptionData = await getSubscriptionsData(session);
        const plan = subscriptionData?.plan;

        if (plan === 'Starter') limit = 10;
        else if (plan === 'Pro') limit = 49;
        else if (plan === 'Advance') limit = 100;

        const recoveredCount = recoveredCarts.length;

        if (recoveredCount >= limit) {
          return { data: 'Limit exceeded', status: false };
        } else {
          return { data: 'Limit not exceeded', status: true };
        }
      }
      
    } else {
      return { data: 'No recovered carts', status: true };
    }
  }

  return { data: 'No matching carts or limit not exceeded', status: true };
}

export const getAbandonedCarts = async (session: any) => {
  let allCheckouts: any = [];
  let lastId = null;

  try {
    do {
      const response: any = await fetch(
        `https://${session.shop}/admin/api/2024-10/checkouts.json?limit=250${lastId ? `&since_id=${lastId}` : ''}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": session.accessToken,
          },
        }
      );

      const responseData = await response.json();
      const checkouts = responseData.checkouts;

      if (checkouts.length > 0) {
        allCheckouts = [...allCheckouts, ...checkouts];
        lastId = checkouts[checkouts.length - 1].id;
      } else {
        break;
      }

    } while (lastId);

    
    const subscriptionData = await getSubscriptionsData(session);
    
    const referenceDateStr = subscriptionData?.startDate;
    
    const referenceDate = new Date(referenceDateStr);

    const filteredAbandonedCheckouts = allCheckouts.filter(item => {
    
      if (item.created_at) {
        const createdAtDate = new Date(item.created_at);
    
        return createdAtDate > referenceDate;
      }
      return false;
    });
    
    
    const filteredRecoveredCarts = () => {
      return filteredAbandonedCheckouts.filter(item => item.completed_at !== null);
    };
    const recoveredCarts = filteredRecoveredCarts();
    
    return recoveredCarts;

  } catch (error) {
    console.log("error", error);
    return [];
  }
}

export const sendDataAppInstallTopicPubSub = async (message: any) => {
  try {
    await publishMessagePubSubService("install", JSON.stringify(message));
  } catch (err) {
    console.error("Error publishing message:", err);
  }
}

export const deleteConnectPageDataFromFirestore = async (storeId: string) => {
  try {
    await fireStoreDeleteService("ConnectPagedata", storeId);
  } catch (error) {
    console.error("Error deleting ConnectPageCollection from Firestore:", error);
  }
}

async function storeSubscriptionActive(storeId: string) {
  try {
    const doc = await fireStoreFetchService("subscriptions", storeId);

    if (!doc) {
      return { success: false, message: "Store Subscription document does not exist." };
    } else {
      if (doc.status == "ACTIVE") return { success: true, data: doc };
      else return { success: false, message: "Store Subscription Status is NOT SET TO ACTIVE" };
    }
  } catch (error) {
    console.log("error", error);
  }
}

async function handleAddAbandonedCheckouts(checkoutId: string, storeId: string, payload: any) {
  try {
    await fireStoreCreateService("AbandonedCheckoutsData", checkoutId, {
      storeId,
      checkoutId,
      payload,
      createdAt: new Date()
    }, {});

  } catch (error) {
    console.log("handleAddAbandonedCheckouts ERROR", error);
  }
}

export async function getShopDetails(shopName: string, accessToken: string) {
  try {
    const response = await axios({
      method: "POST",
      url: `https://${shopName}/admin/api/2024-10/graphql.json`,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      data: {
        query: `query {
          shop {
            email
            billingAddress {
              country
              phone
            }
          }
        }`
      }
    });

    if (response.status == 200 && response.data.data.shop) {
      return { success: true, email: response.data.data.shop.email, phone: response.data.data.shop.billingAddress.phone, country: response.data.data.shop.billingAddress.country }
    }

  } catch (error) {
    console.log("ERROR ", error);
    return { success: false };
  }
}