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
import { processCKSales } from "~/services/webhooks/orderHandlers/processOrders";
import fireStoreUpdateService from "~/services/fireStoreUpdateService";
import { handleBulkOperationFinish } from "~/services/webhooks/bulkOperationHandlers/handleBulkOperationFinish";

const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');
const checkoutUpdateCollection = firestoreDatabase.collection('checkoutUpdateData');
const SubscriptionsCollection = firestoreDatabase.collection('subscriptions');
const appInsatlledDateCollection = firestoreDatabase.collection('AppInstalledDate');
const AbandonedCheckoutsDataCollection = firestoreDatabase.collection('AbandonedCheckoutsData');

let subscriptionData;

// performance monitoring utility
const logTiming = (label: string, startTime: number, details?: any) => {
  const duration = Date.now() - startTime;
  const durationMs = duration;
  const severity = duration > 5000 ? 'SLOW' : duration > 1000 ? 'MEDIUM' : 'FAST';
  console.log(`[PERF] [${severity}] ${label}: ${durationMs}ms`, details ? JSON.stringify(details) : '');
  return duration;
};

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
  const functionStart = Date.now();
  try {
    const updatedAt = data?.app_subscription?.updated_at;
    const endDate = addDaysToFormattedDate(updatedAt, 30);

    const fetchStart = Date.now();
    const existing = await fireStoreFetchService("subscriptions", storeId); // fetching existing procancelledDate here becuse on first (active status) webhook trigger before data update suddenly secong (canceled status) triggers.
    logTiming(`[setSubscriptionData] Fetch existing subscription`, fetchStart, { storeId });

    const existingProCancelledDate = existing?.proCancelledDate ?? null;

    const createStart = Date.now();
    await fireStoreCreateService("subscriptions", storeId, {
      storeId,
      plan: data?.app_subscription?.name,
      status: data?.app_subscription?.status,
      startDate: updatedAt,
      endDate,
      updatedAt,
      ...(existingProCancelledDate ? { proCancelledDate: existingProCancelledDate } : {}),
    }, {});
    logTiming(`[setSubscriptionData] Create subscription`, createStart, { storeId });
    logTiming(`[setSubscriptionData] Total`, functionStart, { storeId });
  } catch (error) {
    console.log("error on setSubscriptionData", error);
  }
};

const getSubsciptionData = async (storeId: string) => {
  const functionStart = Date.now();
  try {
    const doc = await fireStoreFetchService("subscriptions", storeId);
    logTiming(`[getSubsciptionData]`, functionStart, { storeId, found: !!doc });

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
    console.log("checkoutData==========>", checkoutData?.id, "shopName:", shopName)
    await fireStoreCreateService("checkoutUpdateData", String(data?.id), {
      STORE_ID: shopName,
      UpdateData: checkoutData
    }, {});
    console.log("......setUpdatesData process finish....... shop:", shopName);
  } catch (error) {
    console.log("error on setUpdatesData", error);
  }
};

const shouldProcessWebhook = async (webhookId: string, topic: string) => {
  const webhookRef = firestoreDatabase.collection('processedWebhooks').doc(webhookId);

  try {
    return await firestoreDatabase.runTransaction(async (transaction) => {
      const doc = await transaction.get(webhookRef);
      if (doc.exists) {
        return false; // Already processed
      }
      // Log it as "processing"
      transaction.set(webhookRef, {
        topic,
        processedAt: FieldValue.serverTimestamp(),
        // Optional: TTL to auto-delete after 7 days to save storage
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      return true;
    });
  } catch (error) {
    console.error("Error in idempotency check:", error);
    return false; // Safer to skip if DB is failing
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
  const authStart = Date.now();
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  logTiming(`[WEBHOOK] Authenticate`, authStart, { topic, shop });

  if (!admin && topic !== "SHOP_REDACT") {
    console.error(`[WEBHOOK ERROR] Unauthorized webhook attempt - Topic: ${topic} | Shop: ${shop}`);
    throw new Response();
  }

  console.log(`[WEBHOOK] Received - Topic: ${topic} | Shop: ${shop}`);

  // sending response immediately to acknowledge webhook
  // processing data asynchronously in background (non-blocking)
  (async () => {
    try {
      if (topic === "CHECKOUTS_UPDATE") {
        const uniqueKey = `${topic}_${payload?.id}_${payload?.updated_at}`;
        const isNew = await shouldProcessWebhook(uniqueKey, topic);

        if (!isNew) {
          console.log(`[IDEMPOTENCY] Skipping duplicate webhook: ${uniqueKey}`);
          return;
        }
      }
      await processWebhookTopic(topic, payload, shop, session, admin);
    } catch (error) {
      console.error(`[WEBHOOK ERROR] Failed to process ${topic} for shop ${shop}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        topic,
        shop,
        timestamp: new Date().toISOString(),
      });
    }
  })();

  // returning 200 immediately to acknowledge receipt
  // webhook processing happens in background and does NOT block this response
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

const processWebhookTopic = async (topic: string, payload: any, shop: string, session: any, admin: any) => {
  const totalStart = Date.now();
  const logContext = { topic, shop, timestamp: new Date().toISOString() };

  console.log(`[WEBHOOK PROCESSING] Started - ${topic} for ${shop}`);

  switch (topic) {
    case "CHECKOUTS_CREATE":
      try {

        const checkoutIdentifier =
          payload?.id ??
          (payload?.name ? payload.name.replace("#", "") : null);
        // console.log("[CHECKOUTS_CREATE] payload?.id", payload?.id, "shop:", shop);
        // console.log("[CHECKOUTS_CREATE] payload.name", payload?.name, "shop:", shop);
        console.log(`[CHECKOUTS_CREATE] Resolved checkoutIdentifier: ${checkoutIdentifier}, shop: ${shop}`);
        if (!checkoutIdentifier) {
          console.warn(`[CHECKOUTS_CREATE] Skipped - No checkout identifier`, {
            shop,
            payloadKeys: Object.keys(payload || {})
          });
          return;
        }
        console.log(`[CHECKOUTS_CREATE] Processing - ID: ${checkoutIdentifier}, shop: ${shop}`);
        const subStart = Date.now();
        const hasActiveSubscription = await checkSubscriptionStatus(session?.shop as string);
        logTiming(`[CHECKOUTS_CREATE] Subscription check`, subStart);

        if (hasActiveSubscription) {
          const dataStart = Date.now();
          await setCheckoutData({ ...payload, id: checkoutIdentifier }, session?.shop as string);
          logTiming(`[CHECKOUTS_CREATE] Set checkout data`, dataStart);
          console.log(`[CHECKOUTS_CREATE] Completed for checkout ${checkoutIdentifier}`);
        } else {
          console.log(`[CHECKOUTS_CREATE] Skipped - No active subscription for ${shop}`);
        }
      } catch (error) {
        console.error(`[CHECKOUTS_CREATE ERROR]`, {
          checkoutId: payload?.id ?? payload?.name,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;
    case "CHECKOUTS_UPDATE":
      try {
        const checkoutIdentifier =
          payload?.id ??
          (payload?.name ? payload.name.replace("#", "") : null);
        // console.log("[CHECKOUTS_UPDATE] payload?.id", payload?.id, "shop: ", shop)
        // console.log("[CHECKOUTS_UPDATE] payload.name", payload.name, "shop: ", shop)
        if (!checkoutIdentifier) {
          console.warn(`[CHECKOUTS_UPDATE] Skipped - No checkout identifier`, {
            shop,
            payloadId: checkoutIdentifier
          });
          return;
        }
        console.log(`[CHECKOUTS_UPDATE] Processing - ID: ${checkoutIdentifier}, shop: ${shop}`);
        const subStart = Date.now();
        const hasActiveSubscription = await checkSubscriptionStatus(session?.shop as string);
        logTiming(`[CHECKOUTS_UPDATE] Subscription check`, subStart);
        // console.log(`[CHECKOUTS_UPDATE] hasActiveSubscription: ${hasActiveSubscription} shop: ${shop}`);
        if (hasActiveSubscription) {
          const updateStart = Date.now();
          // console.log(`[CHECKOUTS_UPDATE] inside if : ${hasActiveSubscription} shop: ${shop}`);
          await setUpdatesData(
            { ...payload, id: checkoutIdentifier },
            session?.shop as string
          );
          logTiming(`[CHECKOUTS_UPDATE] Set update data`, updateStart);
          // handling checkouts without phone
          if (payload?.phone == null) {
            const checkoutData = {
              checkoutId: checkoutIdentifier,
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
                createdAt: FieldValue.serverTimestamp()
              },
              { merge: true }
            );

            const shopDocRef = parentShopRef
              .collection("checkouts")
              .doc(checkoutIdentifier.toString());

            await shopDocRef.set(checkoutData, { merge: true });
            console.log(`[CHECKOUTS_UPDATE] Completed - No phone number tracked for ${checkoutIdentifier}`);
          } else {
            console.log(`[CHECKOUTS_UPDATE] Completed for checkout ${checkoutIdentifier}`);
          }
        } else {
          console.log(`[CHECKOUTS_UPDATE] Skipped - No active subscription for ${shop}`);
        }
      } catch (error) {
        console.error(`[CHECKOUTS_UPDATE ERROR]`, {
          checkoutId: payload?.id ?? payload?.name,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;
    case "APP_UNINSTALLED":
      try {
        console.log(`[APP_UNINSTALLED] Processing for ${shop}`);
        const uninstallStart = Date.now();

        const newDataToSave = {
          appUninstalledDate: new Date().toISOString(),
          email: payload.email,
          country: payload.country,
          address: payload.address1,
          city: payload.city,
          shop_owner: payload.shop_owner
        };

        const fsStart = Date.now();
        await fireStoreCreateService("AppUninstalledDate", shop, newDataToSave, {});
        logTiming(`[APP_UNINSTALLED] Firestore create uninstalled date`, fsStart);

        const delSubStart = Date.now();
        await deleteSubscriptionData(session?.shop as string);
        logTiming(`[APP_UNINSTALLED] Delete subscription`, delSubStart);

        const delAppStart = Date.now();
        await deleteAppInstalledDate(session?.shop as string);
        logTiming(`[APP_UNINSTALLED] Delete app installed date`, delAppStart);

        const updateStart = Date.now();
        await fireStoreUpdateService(
          "onboardingProgress",
          session?.shop as string,
          { hideOnboarding: false }
        );
        logTiming(`[APP_UNINSTALLED] Update onboarding progress`, updateStart);

        const pubStart = Date.now();
        await publishMessagePubSubService("uninstall", JSON.stringify(payload));
        logTiming(`[APP_UNINSTALLED] Publish to PubSub`, pubStart);

        if (session) {
          await db.session.deleteMany({ where: { shop } });
        }

        // deleting instance data
        try {
          const instanceData = await fireStoreFetchService("InstanceData", shop);
          if (instanceData?.idInstance) {
            const responseDeleteInstance = await fetch(
              `${process.env.PARTNER_API_URL}/partner/deleteInstanceAccount/${process.env.PARTNER_TOKEN}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idInstance: instanceData.idInstance })
              }
            );

            if (responseDeleteInstance.ok) {
              await fireStoreDeleteService("InstanceData", shop);
              console.log(`[APP_UNINSTALLED] Instance deleted for ${shop}`);
            } else {
              console.warn(`[APP_UNINSTALLED] Instance API returned status ${responseDeleteInstance.status}`);
            }
          }
        } catch (instanceError) {
          console.error(`[APP_UNINSTALLED] Error deleting instance`, {
            shop,
            error: instanceError instanceof Error ? instanceError.message : String(instanceError),
            stack: instanceError instanceof Error ? instanceError.stack : undefined,
          });
        }

        console.log(`[APP_UNINSTALLED] Completed for ${shop}`);
      } catch (error) {
        console.error(`[APP_UNINSTALLED ERROR]`, {
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'APP_SUBSCRIPTIONS_UPDATE':
      try {
        console.log(`[APP_SUBSCRIPTIONS_UPDATE] Processing for ${shop}`);
        const subUpdateStart = Date.now();

        const subscription = payload?.app_subscription;
        const incomingPlan = subscription?.name;
        const incomingStatus = subscription?.status;
        const isProPlan = incomingPlan === "Pro";
        const isCancelled = incomingStatus === "CANCELLED";

        const fetchStart = Date.now();
        const subscriptionDataFound: any = await fireStoreFetchService("subscriptions", shop);
        logTiming(`[APP_SUBSCRIPTIONS_UPDATE] Fetch subscription data`, fetchStart, { shop });

        const proCancelledDate = (isProPlan && isCancelled)
          ? subscription?.updated_at
          : subscriptionDataFound?.proCancelledDate ?? null;

        const documentRef = SubscriptionsCollection.doc(shop);

        if (!subscriptionDataFound || (subscriptionDataFound?.name !== "Free" && incomingStatus !== "CANCELLED")) {
          const setStart = Date.now();
          await setSubscriptionData(payload, shop);
          logTiming(`[APP_SUBSCRIPTIONS_UPDATE] Set subscription data`, setStart, { plan: incomingPlan, status: incomingStatus });
          console.log(`[APP_SUBSCRIPTIONS_UPDATE] Created/Updated subscription - Plan: ${incomingPlan}, Status: ${incomingStatus}`);
        }
        else if (isProPlan && isCancelled) {
          const updateStart = Date.now();
          await documentRef.update({ proCancelledDate, updatedAt: subscription?.updated_at });
          logTiming(`[APP_SUBSCRIPTIONS_UPDATE] Update Pro cancellation`, updateStart);
          console.log(`[APP_SUBSCRIPTIONS_UPDATE] Marked Pro plan as cancelled`);
        } else {
          console.log(`[APP_SUBSCRIPTIONS_UPDATE] Skipped cancellation of non-Pro plan: ${incomingPlan}`);
        }
        logTiming(`[APP_SUBSCRIPTIONS_UPDATE] Total`, subUpdateStart, { shop, plan: incomingPlan, status: incomingStatus });
      } catch (error) {
        console.error(`[APP_SUBSCRIPTIONS_UPDATE ERROR]`, {
          shop,
          plan: payload?.app_subscription?.name,
          status: payload?.app_subscription?.status,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'ORDERS_CREATE':
      try {
        console.log(`[ORDERS_CREATE] Processing - ID: ${payload?.id}, Checkout: ${payload?.checkout_id}`);
        const orderCreateStart = Date.now();

        const processSalesStart = Date.now();
        processCKSales(payload, session?.shop as string);
        logTiming(`[ORDERS_CREATE] Process CK sales`, processSalesStart);

        const subStart = Date.now();
        const hasActiveSub = await checkSubscriptionStatus(session?.shop as string);
        logTiming(`[ORDERS_CREATE] Subscription check`, subStart);

        if (hasActiveSub) {
          const pubStart = Date.now();
          await sendDataToPubSub(payload);
          logTiming(`[ORDERS_CREATE] Send to PubSub`, pubStart);
          console.log(`[ORDERS_CREATE] Published to PubSub - Order: ${payload?.id}`);
        } else {
          console.log(`[ORDERS_CREATE] Skipped - No active subscription for ${shop}`);
        }
        logTiming(`[ORDERS_CREATE] Total`, orderCreateStart, { orderId: payload?.id });
      } catch (error) {
        console.error(`[ORDERS_CREATE ERROR]`, {
          orderId: payload?.id,
          checkoutId: payload?.checkout_id,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'ORDERS_PAID':
      try {
        console.log(`[ORDERS_PAID] Processing - Checkout: ${payload?.checkout_id}`);
        const paidStart = Date.now();
        handleOrdersPaidWebhookService(payload, shop);
        logTiming(`[ORDERS_PAID] Handle order`, paidStart, { checkoutId: payload?.checkout_id });
        console.log(`[ORDERS_PAID] Handled for checkout ${payload?.checkout_id}`);
      } catch (error) {
        console.error(`[ORDERS_PAID ERROR]`, {
          checkoutId: payload?.checkout_id,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'CUSTOMERS_UPDATE':
      try {
        console.log(`[CUSTOMERS_UPDATE] Processing - Customer: ${payload?.id}`);
        const customerUpdateStart = Date.now();
        processCustomerUpdate({ payload, shop });
        logTiming(`[CUSTOMERS_UPDATE] Process customer update`, customerUpdateStart, { customerId: payload?.id });
        console.log(`[CUSTOMERS_UPDATE] Completed for customer ${payload?.id}`);
      } catch (error) {
        console.error(`[CUSTOMERS_UPDATE ERROR]`, {
          customerId: payload?.id,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'CUSTOMERS_DELETE':
      try {
        console.log(`[CUSTOMERS_DELETE] Processing - Customer: ${payload?.id}`);
        const customerDeleteStart = Date.now();
        processCustomerDelete({ payload, shop });
        logTiming(`[CUSTOMERS_DELETE] Process customer delete`, customerDeleteStart, { customerId: payload?.id });
        console.log(`[CUSTOMERS_DELETE] Completed for customer ${payload?.id}`);
      } catch (error) {
        console.error(`[CUSTOMERS_DELETE ERROR]`, {
          customerId: payload?.id,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case 'BULK_OPERATIONS_FINISH':
      try {
        console.log(`[BULK_OPERATIONS_FINISH] Processing - BulkId: ${payload?.admin_graphql_api_id}`);
        const bulkOperationFinishStart = Date.now();
        await handleBulkOperationFinish({
          payload,
          session,
          shop,
        });
        logTiming(`[BULK_OPERATIONS_FINISH] Process bulk operation finish`, bulkOperationFinishStart, { bulkId: payload?.admin_graphql_api_id });
      } catch (error) {
        console.error("[BULK_OPERATIONS_FINISH ERROR]", {
          operationId: payload?.id,
          shop,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;

    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      console.log(`[WEBHOOK] Compliance request received - Topic: ${topic} for ${shop}`);
      break;

    default:
      console.warn(`[WEBHOOK] Unhandled topic: ${topic} for ${shop}`);
  }

  const totalDuration = logTiming(`[WEBHOOK PROCESSING] Total for ${topic}`, totalStart, { shop });

  // Log warning if webhook processing takes longer than 10 seconds
  if (totalDuration > 10000) {
    console.warn(`[WEBHOOK WARNING] SLOW WEBHOOK DETECTED - ${topic} took ${totalDuration}ms for ${shop}`);
  }
};
