import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";
import db from '../db.server'

const pubsub = new PubSub();
const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');
// let recoveredCarts;


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

// export const getRecoveredCartslist = (data) => {
//   recoveredCarts = data;
// }

// const checkRecoveredCarts = async (session) => {
//   console.log('recoveredCarts', recoveredCarts);

//   //get recovered carts list
//   //check if the list is matching any doc in database
//   //if match then get plan data
//   //check limit exceeded or not , if not the return true and increase count
//   //if yes then return false
//   //if list not match return true
// }

// Function to handle old checkout logic
const handleOldCheckout = async (checkout, shop, token, session) => {
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
        // console.log(`Sending updated checkout ${checkoutId} to Google Pub/Sub.`);

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
          const HasToSend = await checkMatching(session);
          console.log('matchedCheckedData======== ', HasToSend?.data);

          if (HasToSend && HasToSend?.status == true) {
            await sendDataToPubSub(objj);
            await setsubscriptionAbandonedCarts(objj);
            console.log('data to send to pubsub ============', objj);
          } else if (HasToSend && HasToSend?.status == false) {
            console.log('data not send to pubsub----------------------');
          } else if (!HasToSend) {
            await sendDataToPubSub(objj);
            await setsubscriptionAbandonedCarts(objj);
            console.log('data to send to pubsub ============', objj);
          } else {
            console.log('nothing is ----------------------');
          }


        } else {
          const HasToSend = await checkMatching(session);
          if (HasToSend && HasToSend?.status == true) {
            await sendDataToPubSub(objj);
            await setsubscriptionAbandonedCarts(objj);
            console.log('data to send to pubsub ============', objj);
          } else if (HasToSend && HasToSend?.status == false) {
            console.log('data not send to pubsub----------------------');
          } else if (!HasToSend) {
            await sendDataToPubSub(objj);
            await setsubscriptionAbandonedCarts(objj);
            console.log('data to send to pubsub ============', objj);
          } else {
            console.log('nothing is ----------------------');
          }

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
  console.log("=====calling function==========");

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  // console.log('tenMinutesAgo', tenMinutesAgo);


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
        await handleOldCheckout(checkout, session.shop, session.accessToken, session);
      }

    });
  } catch (error) {
    console.error("Error fetching old checkouts:", error);
  }
}



export const setAppInstalledDate = async (session, data) => {

  const collection = firestoreDatabase.collection('AppInstalledDate');
  await collection.doc(`${session.shop}`).set(data, { merge: true });
  console.log('AppInstalledDate set successfully');

}

export const getAppInstalledDate = async (session) => {
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

export const getSubscriptionsData = async (session) => {
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

// export const checkMatching = async (session) => {
//   //get storeId data from db
//   const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
//   const subscriptionQuerySnapshot = await collection.where("STORE_ID", "==", session.shop).get();
//   // console.log("subscriptionQuerySnapshot ==== ",subscriptionQuerySnapshot);

//   // if (subscriptionQuerySnapshot.empty) {
//   //   console.log('No subscriptionAbandonedCarts found!');
//   //   return true;
//   // }
//   // else {
//     //get recovered carts data
//     let output;
//       subscriptionQuerySnapshot?.forEach(async (doc) => {
//         const docData = doc.data();

//         const checkoutId = docData?.UpdateData?.id;
//         // console.log('checkoutId', checkoutId);
//         // console.log('recoveredCarts', recoveredCarts);

//         if (recoveredCarts?.length > 0) {
//           const matchedCart = recoveredCarts?.find(c => c.id == checkoutId);

//           if (matchedCart) {//if recovered cart matched means somthing recoverd from this month abandoned carts...
//             console.log('matchedCart', matchedCart.id);
//             //check limit exceed or not
//             let limit = 0;
//             const subscriptionData = await getSubscriptionsData(session);
//             const plan = subscriptionData?.plan;
//             // console.log('plan=====',plan);

//             if (plan == 'Starter') { limit = 10 }
//             else if (plan == 'Pro') { limit = 49 }
//             else if (plan == 'Advance') { limit == 99 }
//             else { limit = 0 }
//             console.log('limit=========', limit);

//             // const appInstalledDate = await getAppInstalledDate(session);
//             // const recoveredCount = appInstalledDate?.recoveredcarts;

//             const recoveredCount = recoveredCarts?.length;
//             console.log('recoveredCount =====', recoveredCount);
//             //if limit exceed stop pubsub sending
//             if (recoveredCount >= limit) {
//               console.log('Limit exceed', recoveredCount, limit);
//               return false;
//             } else {//if not exceed then return true
//               console.log('Limit not exceed', recoveredCount, limit);
//               output = "chckingggggg"
//               return " ======== Limit not exceed ========";
//             }
//           } else {//if no matching return true
//             console.log('no matching');
//             return true;
//           }
//         } else {//if no recovered carts return true
//           console.log('no recoveredCarts');
//           return true;
//         }
//       });
//       return output;
//   // }

// }

export const checkMatching = async (session) => {
  // Get storeId data from Firestore
  const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
  const subscriptionQuerySnapshot = await collection.where("STORE_ID", "==", session.shop).get();

  // If no documents found, return true
  if (subscriptionQuerySnapshot.empty) {
    console.log('No subscriptionAbandonedCarts found!');
    return { data: 'No subscriptionAbandonedCarts found', status: true };
  }
  const recoveredCarts = await getAbandonedCarts(session);
  // console.log('recoveredCarts=====', recoveredCarts);
  // Iterate through each document in the snapshot
  for (const doc of subscriptionQuerySnapshot.docs) {
    const docData = doc.data();
    const checkoutId = docData?.UpdateData?.id || docData?.checkoutId || docData?.id || null;

    if (recoveredCarts?.length > 0) {
      const matchedCart = recoveredCarts.find(c => c.id == checkoutId);
      //if recovered cart matched means somthing recoverd from this months abandoned carts...
      if (matchedCart) {
        console.log('matchedCart', matchedCart.id);

        // Check plan limit and check if limit exceeded
        let limit = 0;
        const subscriptionData = await getSubscriptionsData(session);
        const plan = subscriptionData?.plan;

        if (plan === 'Starter') limit = 10;//10
        else if (plan === 'Pro') limit = 49;//49
        else if (plan === 'Advance') limit = 100;//100

        // console.log('limit =========', limit);

        const recoveredCount = recoveredCarts.length;
        console.log('recoveredCount =====', recoveredCount);

        // Check if the recovered count has exceeded the limit
        if (recoveredCount >= limit) {
          // console.log('Limit exceeded:', recoveredCount, limit);
          return { data: 'Limit exceeded', status: false };
        } else {
          // console.log('Limit not exceeded:', recoveredCount, limit);
          return { data: 'Limit not exceeded', status: true };
        }
      } 
      // else {
      //   // console.log('No matching cart found');
      //   return { data: 'No matching cart found', status: true };
      // }
    } else {
      // console.log('No recovered carts');
      return { data: 'No recovered carts', status: true };
    }
  }

  return { data: 'No matching carts or limit not exceeded', status: true };
};




export const getAbandonedCarts = async (session) => {
  let allCheckouts = [];
  let lastId = null;

  try {
    do {
      const response = await fetch(
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
        lastId = checkouts[checkouts.length - 1].id; // Get the ID of the last item in this batch
      } else {
        break; // Stop if no more checkouts are returned
      }
      
    } while (lastId); // Continue until there are no more checkouts

    console.log("Fetched all checkouts from Shopify:");
    const subscriptionData = await getSubscriptionsData(session);
    //get abandonedCarts after the plan monthStartDate
    const referenceDateStr = subscriptionData?.startDate;
    // const referenceDateStr = '2024-11-06T10:28:53+05:30';
    const referenceDate = new Date(referenceDateStr);

    const filteredAbandonedCheckouts = allCheckouts.filter(item => {
      // Check if 'created_at' exists and parse it as a date
      if (item.created_at) {
        const createdAtDate = new Date(item.created_at);
        // Return only the items where created_at is greater than the reference date
        return createdAtDate > referenceDate;
      }
      return false;
    });
    // console.log('filteredAbandonedCheckouts',filteredAbandonedCheckouts);
    //get recovered carts only for the current month abandoned carts
    const filteredRecoveredCarts = () => {
      return filteredAbandonedCheckouts.filter(item => item.completed_at !== null);
    };
    const recoveredCarts = filteredRecoveredCarts();
    // console.log('recoveredCarts=========',recoveredCarts);
    return recoveredCarts;

  } catch (error) {
    console.log("Error fetching checkouts from Shopify:", error);
    return [];
  }
};


export const sendDataAppInstallTopicPubSub = async (message) => {
  const messageJson = JSON.stringify(message);
  const topicName = "install";

  try {
    const topic = pubsub.topic(topicName);
    const messageId = await topic.publishMessage({
      data: Buffer.from(messageJson),
    });
    console.log(`Message ${messageId} published to ${topicName} topic`);
  } catch (err) {
    console.error("Error publishing message:", err);
  }
};
