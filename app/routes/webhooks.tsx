import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();
const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');


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
      console.log("APP UNINSTALLED WEBHOOK");
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
