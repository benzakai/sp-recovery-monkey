import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { FieldValue, Firestore } from "@google-cloud/firestore";
import publishMessagePubSubService from "~/services/publishMessagePubSubService";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import handleOrdersPaidWebhookService from "~/services/handleOrdersPaidWebhookService";
import processCustomerUpdate from "~/services/webhooks/handlers/processCustomerUpdate";
import processCustomerDelete from "~/services/webhooks/handlers/processCustomerDelete";
import { fetchCustomerDataService } from "~/services/webhooks/handlers/fetchCustomerDataService";

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
    const updatedAt = data?.app_subscription?.updated_at;
    const endDate = addDaysToFormattedDate(updatedAt, 30);
    const existing = await fireStoreFetchService("subscriptions", storeId); // fetching existing procancelledDate here becuse on first (active status) webhook trigger before data update suddenly secong (canceled status) triggers.
    const existingProCancelledDate = existing?.proCancelledDate ?? null;

    await fireStoreCreateService("subscriptions", storeId, {
      storeId,
      plan: data?.app_subscription?.name,
      status: data?.app_subscription?.status,
      startDate: updatedAt,
      endDate,
      updatedAt,
      ...(existingProCancelledDate ? { proCancelledDate: existingProCancelledDate } : {}),
    }, {});
  } catch (error) {
    console.log("error on setSubscriptionData", error);
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
    let checkoutData = data;
    // console.log("setUpdatesData data", data);
    // console.log("data.customer.id", data?.customer?.id, "data.email", data?.customer?.email || data.email, "shopName:", shopName);
    if (!data?.customer?.id) { // If customer ID is not present, fetching customer id from email
      // console.log("setUpdatesData process started....", data?.id, "shopName:", shopName);
      if (data?.customer?.email || data.email) {
        const dataGot = await fetchCustomerDataService({ shop: shopName, email: data?.customer?.email || data.email });
        // console.log("dataGot", dataGot)
        if (dataGot.success && dataGot?.customer?.id) {
          checkoutData = {
            ...data, customer: {
              ...data.customer,
              id: Number(dataGot.customer.id.split('/').pop()),
              admin_graphql_api_id: dataGot.customer.id,
              email: dataGot.customer.defaultEmailAddress?.emailAddress ?? null,
              first_name: dataGot.customer.firstName ?? null,
              last_name: dataGot.customer.lastName ?? null,
              created_at: dataGot.customer.createdAt ?? null,
              updated_at: dataGot.customer.updatedAt ?? null,
              phone: dataGot.customer.defaultPhoneNumber?.phoneNumber ?? null
            }
          };
        } else {
          // console.log("Error fetching customer data:", dataGot.error);
        }
      } else {
        // console.log("No customer email found in data, skipping customer data fetch.");
      }
    }
    // console.log("checkoutData==========>", checkoutData)
    await fireStoreCreateService("checkoutUpdateData", String(data?.id), {
      STORE_ID: shopName,
      UpdateData: checkoutData
    }, {});
    // console.log("......setUpdatesData process finish.......");
  } catch (error) {
    console.log("error on setUpdatesData", error);
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
  console.log(`[WEBHOOK]=====================> Topic: ${topic} | Shop: ${shop}`);
  switch (topic) {
    case "CHECKOUTS_CREATE":
      const processCheckoutsCreate = async () => {
        try {
          console.log("CHECKOUTS_CREATE webhook triggered: Checkout ID => ", payload?.id, "shop =>", shop);
          if (await checkSubscriptionStatus(session?.shop as string)) {
            await setCheckoutData(payload, session?.shop as string);
          }
        } catch (error) {
          console.log("error on processCheckoutsCreate", error);
        } finally {
          console.log("==========>CHECKOUTS_CREATE on process end<===========");
        }
      }
      processCheckoutsCreate()
      break;
    case "CHECKOUTS_UPDATE":
      const processCheckoutsUpdate = async () => {
        try {
          console.log("CHECKOUTS_UPDATE webhook triggered: Checkout ID => ", payload?.id, "shop =>", shop);
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

              const parentShopRef = firestoreDatabase
                .collection("CheckoutsWithoutPhoneNumberUpdated")
                .doc(shop);

              await parentShopRef.set(
                {
                  createdAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );

              const shopDocRef = parentShopRef
                .collection("checkouts")
                .doc(payload.id.toString());

              await shopDocRef.set(checkoutData, { merge: true });
            }
          }
        } catch (error) {
          console.log("error on processCheckoutsUpdate", error);
        } finally {
          console.log("==========>CHECKOUTS_UPDATE on process end<==========");
        }
        // console.log("-----------------> processCheckoutsUpdate FINISHED <----------------");
      }
      processCheckoutsUpdate()
      break;
    case "APP_UNINSTALLED":
      const processAppUninstalled = async () => {
        try {
          // console.log("Triggered APP_UNINSTALLED for shop:", session?.shop);
          const newDataToSave = {
            appUninstalledDate: new Date().toISOString(),
            email: payload.email,
            country: payload.country,
            address: payload.address1,
            city: payload.city,
            shop_owner: payload.shop_owner
          }
          await fireStoreCreateService("AppUninstalledDate", shop, newDataToSave, {});
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
        } catch (error) {
          console.log("error on processAppUninstalled", error);
        } finally {
          console.log("==========>APP_UNINSTALLED on process end<===========");
        }
      }
      processAppUninstalled()
      break;

    case 'APP_SUBSCRIPTIONS_UPDATE':
      const processAppSubscriptionsUpdate = async () => {
        try {
          const subscription = payload?.app_subscription;
          const incomingPlan = subscription?.name;
          const incomingStatus = subscription?.status;
          const isProPlan = incomingPlan === "Pro";
          const isCancelled = incomingStatus === "CANCELLED";
          const shop = session?.shop as string;
          // console.log("APP_SUBSCRIPTIONS_UPDATE:", subscription);
          const subscriptionDataFound: any = await fireStoreFetchService("subscriptions", shop);
          // console.log("subscriptionDataFound", subscriptionDataFound);
          const proCancelledDate = (isProPlan && isCancelled)
            ? subscription?.updated_at
            : subscriptionDataFound?.proCancelledDate ?? null;

          const documentRef = SubscriptionsCollection.doc(shop);

          if (!subscriptionDataFound || (subscriptionDataFound?.name !== "Free" && incomingStatus !== "CANCELLED")) {
            await setSubscriptionData(payload, shop);
          }
          else if (isProPlan && isCancelled) {
            await documentRef.update({ proCancelledDate, updatedAt: subscription?.updated_at });
          } else {
            // console.log("Ignored cancellation of non-Pro plan:", incomingPlan);
          }
        } catch (error) {
          console.log("error on processAppSubscriptionsUpdate", error);
        } finally {
          console.log("==========>APP_SUBSCRIPTIONS_UPDATE on process end<===========");
        }
      }
      processAppSubscriptionsUpdate()
      break;

    case 'ORDERS_CREATE':
      const processOrdersCreate = async () => {
        try {
          console.log("ORDERS_CREATE webhook triggered: Order ID => ", payload?.id, " Checkout ID => ", payload?.checkout_id);
          if (await checkSubscriptionStatus(session?.shop as string)) {
            await sendDataToPubSub(payload);
          }
        } catch (error) {
          console.log("error on processOrdersCreate", error);
        } finally {
          console.log("ORDERS_CREATE on process end");
        }
      }
      processOrdersCreate()
      break;
    case 'ORDERS_PAID':
      console.log("ORDERS_PAID:", payload?.checkout_id);
      handleOrdersPaidWebhookService(payload, shop);
      break;

    case 'CUSTOMERS_UPDATE':
      // console.log("CUSTOMERS_UPDATE: ", payload, "   shop ", shop);
      processCustomerUpdate({ payload, shop })
      break;

    case 'CUSTOMERS_DELETE':
      // console.log("CUSTOMERS_DELETE: ", payload, "   shop ", shop);
      processCustomerDelete({ payload, shop })
      break;

    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
