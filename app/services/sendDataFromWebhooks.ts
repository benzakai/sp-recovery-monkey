import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";
import db from '../db.server'

const pubsub = new PubSub();
const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');
let recoveredCarts;


const getFirestoreData = async (collectionName: string) => {
  try {
    const collection = firestoreDatabase.collection(collectionName);
    const snapshot = await collection.get();
    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName}`);
      return [];
    }
    const data = snapshot.docs.map((doc) => doc.data());
    console.log(`Data retrieved from ${collectionName}`);
    return data;
  } catch (error) {
    console.error(`Error retrieving data from ${collectionName}:`, error);
    throw new Error("Failed to retrieve Firestore data");
  }
};

export const getRecoveredCartslist = (data) => {
    recoveredCarts = data;
}

const checkRecoveredCarts = async (session) => {
  console.log('recoveredCarts',recoveredCarts);
  
  //get recovered carts list
  //check if the list is matching any doc in database
  //if match then get plan data
  //check limit exceeded or not , if not the return true and increase count
  //if yes then return false
  //if list not match return true
}

// Function to handle old checkout logic
const handleOldCheckout = async (checkout, shop, token) => {
  console.log('chekcoutData', checkout, shop, token);

  const checkoutId = checkout.checkoutId;

  try {
    const recentOrders = await fetchOrders(shop, token);
    console.log('recentOrders', recentOrders);
    const shopDomain = await getShopDomain(shop, token);
    const orderExists = recentOrders.some(order => order.checkout_id === checkoutId);
    console.log('orderExists', orderExists);

    if (orderExists) {
      await checkoutCollection.doc(checkoutId.toString()).delete();
      await checkoutUpdateCollection.doc(checkoutId.toString()).delete();
      console.log(`Checkout ${checkoutId} converted to an order and deleted from Firestore.`);
    } else {
      console.log(`Checkout ${checkoutId} is abandoned.`);

      const checkoutUpdateDoc = await checkoutUpdateCollection.doc(checkoutId.toString()).get();

      if (checkoutUpdateDoc.exists) {
        console.log(`Sending updated checkout ${checkoutId} to Google Pub/Sub.`);

        console.log("shopshopshop", shop);
        const getGreenAPIData = await getFirestoreData("ConnectPagedata");
        console.log("getGreenAPIData", getGreenAPIData, typeof getGreenAPIData);
        let objj: any = {};
        objj = checkoutUpdateDoc.data();
        objj["SHOP DOMAIN"] = shopDomain;

        if (getGreenAPIData.length > 0) {
          const storeId = shop;
          const filteredData = getGreenAPIData.filter(item =>
            Object.keys(item).length > 0 && item.storeId == storeId
          );


          objj["Green API ID"] = filteredData[0];
          await sendDataToPubSub(objj);
          await setsubscriptionAbandonedCarts(objj);
          console.log('data to send to pubsub', objj);

        } else {
          await sendDataToPubSub(objj);
          await setsubscriptionAbandonedCarts(objj);

          console.log('no green data');
        }

      } else {
        console.log(`No update found for abandoned checkout ${checkoutId}.`);
      }

      // Delete the abandoned checkout from Firestore
      await checkoutCollection.doc(checkoutId.toString()).delete();
      await checkoutUpdateCollection.doc(checkoutId.toString()).delete();
      console.log(`Abandoned checkout ${checkoutId} deleted from Firestore.`);
    }
  } catch (error) {
    console.error(`Error handling checkout ${checkoutId}:`, error);
  }
};

// Function to send data to Google Pub/Sub
const sendDataToPubSub = async (message) => {
  const messageJson = JSON.stringify(message);
  const topicName = "AshitheKing";

  try {
    const topic = pubsub.topic(topicName);
    const messageId = await topic.publishMessage({
      data: Buffer.from(messageJson),
    });
    console.log(`Message ${messageId} published.`);
  } catch (err) {
    console.error("Error publishing message:", err);
  }
};

// Function to fetch orders from Shopify within the last 10 minutes
const fetchOrders = async (shopName, token) => {
  const lastTenMinuteTime = new Date(Date.now() - 1 * 60 * 1000).toISOString();
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
    console.log("Fetched orders from Shopify:", responseData);
    return responseData?.orders;
  } catch (error) {
    console.log("Error fetching orders from Shopify:", error);
    return [];
  }
};

const getShopDomain = async (shopName, token) => {
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
    console.log("domain from Shopify:", responseData);
    return responseData.data?.shop?.primaryDomain?.host;
  } catch (error) {
    console.log("Error fetching domain from Shopify:", error);
    return '';
  }
}

export const sendDataFromWebhooks = async () => {
  console.log("=====checking==========");

  const tenMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
  console.log('tenMinutesAgo', tenMinutesAgo);
  

  try {
    // Query Firestore for checkouts created more than 10 minutes ago
    const oldCheckoutsQuerySnapshot = await checkoutCollection
      .where("createdAt", "<=", tenMinutesAgo)
      .get();
    // Loop through the old checkouts and handle them
    oldCheckoutsQuerySnapshot?.forEach(async (doc) => {
      const checkout = doc.data();
      const session = await db.session.findFirst({
        where: { shop: checkout.storeId }
      });
      console.log('oldCheckouts', checkout);

      if (session) {
        await handleOldCheckout(checkout, session.shop, session.accessToken);
      }

    });
  } catch (error) {
    console.error("Error fetching old checkouts:", error);
  }
}



export const setAppInstalledDate = async (session,data) => {
  
  const collection = firestoreDatabase.collection('AppInstalledDate');
  await collection.doc(`${session.shop}`).set(data, { merge: true });
  console.log('AppInstalledDate set successfully');

}

export const getAppInstalledDate = async(session)=>{
  const collection = firestoreDatabase.collection('AppInstalledDate');
  const doc = await collection.doc(`${session.shop}`).get();
  if (!doc.exists) {
    console.log('No such document!');
    return null;
  } else {
    console.log('Document data:', doc.data());
    return doc.data();
  }
}

export const getSubscriptionsData = async(session)=>{
  const collection = firestoreDatabase.collection('subscriptions');
  const doc = await collection.doc(`${session.shop}`).get();
  if (!doc.exists) {
    console.log('No such document!');
    return null;
  } else {
    console.log('Document data:', doc.data());
    return doc.data();
  }
}


const setsubscriptionAbandonedCarts = async (data) => {
  
  const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
  await collection.add(data);

  console.log('subscriptionAbandonedCarts set successfully');

}

export const checkMatching = async (session)=>{
  //get storeId data from db
  const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
  const subscriptionQuerySnapshot = await collection.where("STORE_ID", "==", session.shop).get();
  //get recovered carts data
  subscriptionQuerySnapshot?.forEach(async (doc) => {
    const docData = doc.data();
    const checkoutId = docData?.UpdateData?.id;
    console.log('checkoutId',checkoutId);
    console.log('recoveredCarts',recoveredCarts);
    if(recoveredCarts.length >0){
      const matchedCart = recoveredCarts?.find(c => c.id == checkoutId);
      if (matchedCart) {//if recovered cart matched
        console.log('matchedCart',matchedCart.id);
        //check limit exceed or not
        let limit;
        const subscriptionData = await getSubscriptionsData(session);
        const plan = subscriptionData?.plan ;
        if(plan == 'Starter'){limit = 10}
        if(plan == 'Pro'){limit = 49}
        if(plan == 'Advance'){limit == 99}
        console.log('limit',limit);
        const appInstalledDate = await getAppInstalledDate(session);
        const recoveredCount = appInstalledDate?.recoveredcarts;
        // console.log('recoveredCount',recoveredCount);
        //if limit exceed stop pubsub sending
        if(recoveredCount >= limit){
          console.log('Limit exceed',recoveredCount,limit);
          // return false;
        }else{//if not exceed then return true
          console.log('Limit not exceed',recoveredCount,limit);
          
          return true;
        }
      }else{//if no matching return true
        console.log('no matching');
        // return true;
      }
    }else{//if no recovered carts return true
      console.log('no recoveredCarts');
      // return true;
    }
    
    
  });
}


