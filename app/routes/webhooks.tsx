import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();
const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');
const SubscriptionsCollection = firestoreDatabase.collection('subscriptions');

function addDaysToFormattedDate(dateStr, daysToAdd) {
  // Parse the input date string into a Date object
  const originalDate = new Date(dateStr);

  // Add the specified number of days (30 in this case)
  originalDate.setDate(originalDate.getDate() + daysToAdd);

  // Format the date back into the original format
  const year = originalDate.getFullYear();
  const month = String(originalDate.getMonth() + 1).padStart(2, '0');
  const day = String(originalDate.getDate()).padStart(2, '0');
  const hours = String(originalDate.getHours()).padStart(2, '0');
  const minutes = String(originalDate.getMinutes()).padStart(2, '0');
  const seconds = String(originalDate.getSeconds()).padStart(2, '0');

  // Get the timezone offset in hours and minutes
  const timezoneOffset = -originalDate.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';

  // Construct the formatted date string
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}


const setSubscriptionData = async (data, storeId) => {
  try {
    if(data?.app_subscription?.status == 'ACTIVE'){
      const result = addDaysToFormattedDate(data?.app_subscription?.updated_at, 30);
      await SubscriptionsCollection.doc(`${storeId}`).set({
        storeId,
        plan: data?.app_subscription?.name,
        status:data?.app_subscription?.status,
        startDate: data?.app_subscription?.updated_at,
        endDate:result
      });
      console.log("setSubscriptionData successfully saved to Firestore.");
    }else{
      console.log("setSubscriptionData not available.");
    }
    
  } catch (error) {
    console.error("Error saving setSubscriptionData to Firestore:", error);
  }
};

const deleteSubscriptionData = async (storeId)=>{
  try {
    await SubscriptionsCollection.doc(`${storeId}`).delete();
    console.log("Subscription data successfully deleted from Firestore.");
  } catch (error) {
    console.error("Error deleting subscription data from Firestore:", error);
  }
}

// Function to set checkout data into Firestore
const setCheckoutData = async (data, storeId) => {
  try {
    await checkoutCollection.doc(`${data?.id}`).set({
      storeId,
      checkoutId: data.id,
      createdAt: new Date(),
    });
    console.log("Checkout data successfully saved to Firestore.");
  } catch (error) {
    console.error("Error saving checkout data to Firestore:", error);
  }
};

// Function to set checkout update data into Firestore (with merging)
const setUpdatesData = async (data, shopName) => {
  try {
    await checkoutUpdateCollection.doc(`${data?.id}`).set(
      {
        STORE_ID: shopName,
        UpdateData: data
      },
      { merge: true }
    );
    console.log("Checkout update data successfully saved to Firestore.");
  } catch (error) {
    console.error("Error saving checkout update data to Firestore:", error);
  }
};

// Webhook handler
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  if (!admin && topic !== "SHOP_REDACT") {
    throw new Response();
  }
  switch (topic) {
    case "CHECKOUTS_CREATE":
      console.log("checkouts/create:", payload);
      await setCheckoutData(payload, session?.shop);
      break;
    case "CHECKOUTS_UPDATE":
      console.log("checkouts/update:", payload);
      await setUpdatesData(payload, session?.shop);
      break;
    case "APP_UNINSTALLED":
      if (session) {
        const sessionDeleted = await db.session.deleteMany({ where: { shop } });
        console.log("sessionDeleted", sessionDeleted);
      }
      await deleteSubscriptionData(session?.shop);
      console.log("APP UNINSTALLED WEBHOOK");
      break;

    case 'APP_SUBSCRIPTIONS_UPDATE':
      console.log("APP_SUBSCRIPTIONS_UPDATE:", payload);
      await setSubscriptionData(payload, session?.shop);
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
