import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Firestore } from "@google-cloud/firestore";
import publishMessagePubSubService from "~/services/publishMessagePubSubService";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import handleOrdersPaidWebhookService from "~/services/handleOrdersPaidWebhookService";

const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');
const SubscriptionsCollection = firestoreDatabase.collection('subscriptions');
const appInsatlledDateCollection = firestoreDatabase.collection('AppInstalledDate');
const AbandonedCheckoutsDataCollection = firestoreDatabase.collection('AbandonedCheckoutsData');

let subscriptionData;

function addDaysToFormattedDate(dateStr: any, daysToAdd: number) {
  const originalDate = new Date(dateStr);
  originalDate.setDate(originalDate.getDate() + daysToAdd);

  const year = originalDate.getFullYear();
  const month = String(originalDate.getMonth() + 1).padStart(2, '0');
  const day = String(originalDate.getDate()).padStart(2, '0');
  const hours = String(originalDate.getHours()).padStart(2, '0');
  const minutes = String(originalDate.getMinutes()).padStart(2, '0');
  const seconds = String(originalDate.getSeconds()).padStart(2, '0');

  const timezoneOffset = -originalDate.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

const setSubscriptionData = async (data: any, storeId: string) => {
  try {
    // if (data?.app_subscription?.status == 'ACTIVE') {
    const result = addDaysToFormattedDate(data?.app_subscription?.updated_at, 30);

    await fireStoreCreateService("subscriptions", storeId, {
      storeId,
      plan: data?.app_subscription?.name,
      status: data?.app_subscription?.status,
      startDate: data?.app_subscription?.updated_at,
      endDate: result
    }, {});
    // }

  } catch (error) {
    console.log("error", error);
  }
};

const getSubsciptionData = async (storeId: string) => {
  try {
    const doc = await fireStoreFetchService("subscriptions", storeId);

    if (!doc) {
      return null;
    } else {
      return doc;
    }
  } catch (error) {
    console.log("error", error);
  }
}

const deleteSubscriptionData = async (storeId: string) => {
  try {
    await fireStoreDeleteService("subscriptions", storeId);
  } catch (error) {
    console.log("error", error);
  }
}

const deleteAppInstalledDate = async (storeId: string) => {
  try {
    await fireStoreDeleteService("AppInstalledDate", storeId);
  } catch (error) {
    console.log("error", error);
  }
}

const setCheckoutData = async (data: any, storeId: string) => {
  try {

    await fireStoreCreateService("users", String(data?.id), {
      storeId,
      checkoutId: data.id,
      createdAt: new Date()
    }, {});

  } catch (error) {
    console.log("error", error);
  }
};

const setUpdatesData = async (data: any, shopName: string) => {
  try {

    await fireStoreCreateService("checkoutUpdateData", String(data?.id), {
      STORE_ID: shopName,
      UpdateData: data
    }, {});
    // console.log("......setUpdatesData process finish.......");
  } catch (error) {
    console.log("error", error);
  }
};

const sendDataToPubSub = async (message: any) => {
  const messageJson = JSON.stringify(message);
  const topicName = "ordersCreate";

  try {
    await publishMessagePubSubService("ordersCreate", JSON.stringify(message));
  } catch (err) {
    console.log("err", err);
  }
};

const checkSubscriptionStatus = async (storeId: string) => {
  subscriptionData = await getSubsciptionData(storeId);

  // if (!subscriptionData || subscriptionData?.status !== 'ACTIVE') {
  if (!subscriptionData) {
    return false;
  }

  return true;
};

// Webhook handler
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  if (!admin && topic !== "SHOP_REDACT") {
    throw new Response();
  }
  switch (topic) {
    case "CHECKOUTS_CREATE":
      console.log("CHECKOUTS_CREATE webhook triggered: Checkout ID => ", payload.id);

      if (await checkSubscriptionStatus(session?.shop as string)) {
        await setCheckoutData(payload, session?.shop as string);
      }
      break;
    case "CHECKOUTS_UPDATE":
      console.log("CHECKOUTS_UPDATE webhook triggered: Checkout ID => ", payload.id);
      const processCheckoutsUpdate = async () => {
        // console.log("-----------------> processCheckoutsUpdate triggered <----------------");
        if (await checkSubscriptionStatus(session?.shop as string)) {
          await setUpdatesData(payload, session?.shop as string);
          // console.log("......after setUpdatesData function call, payload?.phone:", payload?.phone);
          if (payload?.phone == null) {
            const checkoutData = {
              checkoutId: payload.id,
              updatedAt: new Date(),
              createdAt: new Date(payload.created_at),
              payload: payload,
              storeId: session?.shop,
            };
            const shopDocRef = firestoreDatabase.collection('TestCheckoutsWithoutPhoneNumber').doc(shop);
            const shopDoc = await shopDocRef.get();
            if (shopDoc.exists) {
              await shopDocRef.update({
                [payload.id]: checkoutData,
              });
            } else {
              await shopDocRef.set({
                [payload.id]: checkoutData,
              }, { merge: true });
            }
          }
        }
        // console.log("-----------------> processCheckoutsUpdate FINISHED <----------------");
      }
      processCheckoutsUpdate()
      break;
    case "APP_UNINSTALLED":
      await deleteSubscriptionData(session?.shop as string);
      await deleteAppInstalledDate(session?.shop as string);
      await publishMessagePubSubService("uninstall", JSON.stringify(payload));
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      try {
        const instanceData = await fireStoreFetchService("InstanceData", shop);
        const responseDeleteInstance = await fetch(`${process.env.PARTNER_API_URL}/partner/deleteInstanceAccount/${process.env.PARTNER_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idInstance: instanceData.idInstance
          })
        });
        if (responseDeleteInstance.ok) {
          const data = await responseDeleteInstance.json()
          // console.log("responseDeleteInstance data on APP_UNINSTALLED:", data);
          const deletedDBInstanceData = await fireStoreDeleteService("InstanceData", shop);
          // console.log("deletedDBInstanceData on APP_UNINSTALLED", deletedDBInstanceData);
        }
      } catch (error) {
        console.log("error occured on APP_UNINSTALLED responseDeleteInstance", error);
      }

      console.log("APP UNINSTALLED WEBHOOK");
      break;

    case 'APP_SUBSCRIPTIONS_UPDATE':
      // console.log("APP_SUBSCRIPTIONS_UPDATE:", payload.app_subscription);
      const subscriptionDataFound = await fireStoreFetchService("subscriptions", shop);
      // console.log("subscriptionDataFound", subscriptionDataFound);
      if (!subscriptionDataFound || (subscriptionDataFound?.name !== "Free" && payload.app_subscription.status !== "CANCELLED")) {
        await setSubscriptionData(payload, session?.shop as string);
      }
      break;

    case 'ORDERS_CREATE':
      console.log("ORDERS_CREATE webhook triggered: Order ID => ", payload?.id, " Checkout ID => ", payload?.checkout_id);

      if (await checkSubscriptionStatus(session?.shop as string)) {
        await sendDataToPubSub(payload);
      }
      break;
    case 'ORDERS_PAID':
      console.log("ORDERS_PAID:", payload.checkout_id);
      handleOrdersPaidWebhookService(payload, shop);
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
