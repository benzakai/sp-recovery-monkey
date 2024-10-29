import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";
import cron from "node-cron";

const pubsub = new PubSub();
const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');

// Variable to control the cron job
let cronJob;

// Function to start the cron job
const startCronJob = (shop, token) => {
  if (cronJob) {
    console.log("Cron job already running.");
    return;
  }

  console.log("Starting cron job for checking old checkouts.");

  cronJob = cron.schedule("*/10 * * * * *", async () => {
    console.log("CRON is ACtive");
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    try {
      // Query Firestore for checkouts created more than 10 minutes ago
      const oldCheckoutsQuerySnapshot = await checkoutCollection
        .where("createdAt", "<=", tenMinutesAgo)
        .get();

      

      // Loop through the old checkouts and handle them
      oldCheckoutsQuerySnapshot?.forEach(async (doc) => {
        const checkout = doc.data();
        console.log('oldCheckouts', checkout);
        
        await handleOldCheckout(checkout, shop, token);
      });
    } catch (error) {
      console.error("Error fetching old checkouts:", error);
    }
  });
};

// Function to stop the cron job
const stopCronJob = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("Stopped cron job for checking old checkouts.");
  }
};

// Function to handle old checkout logic
const handleOldCheckout = async (checkout, shop, token) => {
  const checkoutId = checkout.checkoutId;

  try {
    // Use fetchOrders to get recent orders and check if the checkoutId exists
    const recentOrders = await fetchOrders(shop, token);
    const orderExists = recentOrders.some(order => order.checkout_id === checkoutId);

    if (orderExists) {
      // If a matching order exists, delete the checkout from Firestore
      await checkoutCollection.doc(checkoutId.toString()).delete();
      await checkoutUpdateCollection.doc(checkoutId.toString()).delete();
      console.log(`Checkout ${checkoutId} converted to an order and deleted from Firestore.`);
    } else {
      // If no matching order exists, it's an abandoned checkout
      console.log(`Checkout ${checkoutId} is abandoned.`);

      // Check if there's an update for this checkout in the checkoutUpdateCollection
      const checkoutUpdateDoc = await checkoutUpdateCollection.doc(checkoutId.toString()).get();

      if (checkoutUpdateDoc.exists) {
        console.log(`Sending updated checkout ${checkoutId} to Google Pub/Sub.`);
        // stopCronJob();
        await sendDataToPubSub(checkoutUpdateDoc.data());
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

// Function to set checkout data into Firestore
const setCheckoutData = async (data) => {
  try {
    await checkoutCollection.doc(`${data?.id}`).set({
      checkoutId: data.id,
      createdAt: new Date(),
    });
    console.log("Checkout data successfully saved to Firestore.");
  } catch (error) {
    console.error("Error saving checkout data to Firestore:", error);
  }
};

// Function to set checkout update data into Firestore (with merging)
const setUpdatesData = async (data,shopName) => {
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
      await setCheckoutData(payload);
      startCronJob(session?.shop, session?.accessToken);
      break;
    case "CHECKOUTS_UPDATE":
      console.log("checkouts/update:", payload);
      await setUpdatesData(payload,session?.shop);
      break;
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
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
