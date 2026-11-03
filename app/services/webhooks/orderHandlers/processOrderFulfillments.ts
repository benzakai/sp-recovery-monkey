import { firestore } from "~/utils/firestore.server";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import publishMessagePubSubService from "~/services/publishMessagePubSubService";
import { isProPlanOrHigher } from "~/utils/plans";

const TOPIC_NAME = "ordersFulfilled";
const SKIPPED_STATUSES = ["cancelled", "error", "failure"];
const DAY_MS = 24 * 60 * 60 * 1000;
// later updates on older fulfillments (refunds, returns, notes) are ignored without any Firestore read
const MAX_FULFILLMENT_AGE_DAYS = 10;
// must stay longer than MAX_FULFILLMENT_AGE_DAYS, otherwise a deleted record would make an old fulfillment look new and send it again
const RECORD_TTL_DAYS = 20;

const isRecentFulfillment = (fulfillment: any) => {
    const createdAt = new Date(fulfillment?.created_at).getTime();
    // keep it when created_at is missing or invalid, so a fulfillment is never lost
    if (isNaN(createdAt)) return true;
    return Date.now() - createdAt <= MAX_FULFILLMENT_AGE_DAYS * DAY_MS;
};

const getTrackingKey = (fulfillment: any) => {
    const trackingNumbers = fulfillment?.tracking_numbers?.length
        ? fulfillment.tracking_numbers
        : [fulfillment?.tracking_number];
    return trackingNumbers.filter(Boolean).sort().join(",");
};

const pickAddress = (address: any) => address ? {
    first_name: address.first_name,
    last_name: address.last_name,
    phone: address.phone,
    country_code: address.country_code,
} : null;

// only what the external service needs to send the WhatsApp message, the full order payload is too large
const buildFulfillmentMessage = (payload: any, shop: string, eventType: string, fulfillment: any) => ({
    shop,
    eventType,
    // first phone found, in this order, so the external service doesn't have to look in several places
    phone: payload.customer?.phone
        || payload.phone
        || payload.shipping_address?.phone
        || payload.billing_address?.phone
        || null,
    order: {
        id: payload.id,
        name: payload.name,
        order_number: payload.order_number,
        created_at: payload.created_at,
        email: payload.email,
        phone: payload.phone,
        currency: payload.currency,
        total_price: payload.total_price,
        financial_status: payload.financial_status,
        fulfillment_status: payload.fulfillment_status,
        customer_locale: payload.customer_locale,
        order_status_url: payload.order_status_url,
    },
    customer: payload.customer ? {
        id: payload.customer.id,
        first_name: payload.customer.first_name,
        last_name: payload.customer.last_name,
        email: payload.customer.email,
        phone: payload.customer.phone,
    } : null,
    shipping_address: pickAddress(payload.shipping_address),
    billing_address: pickAddress(payload.billing_address),
    fulfillment: {
        id: fulfillment.id,
        name: fulfillment.name,
        status: fulfillment.status,
        shipment_status: fulfillment.shipment_status,
        created_at: fulfillment.created_at,
        updated_at: fulfillment.updated_at,
        tracking_company: fulfillment.tracking_company,
        tracking_number: fulfillment.tracking_number,
        tracking_numbers: fulfillment.tracking_numbers,
        tracking_url: fulfillment.tracking_url,
        tracking_urls: fulfillment.tracking_urls,
        line_items: (fulfillment.line_items || []).map((item: any) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            title: item.title,
            variant_title: item.variant_title,
            sku: item.sku,
            quantity: item.quantity,
        })),
    },
});

// same Pro check as handleUninstallAndPlanDowngrade, manualPlan from permissions also counts
const hasActiveProPlan = async (shop: string) => {
    const [subscriptionData, permissionsData] = await Promise.all([
        fireStoreFetchService("subscriptions", shop),
        fireStoreFetchService("permissions", shop),
    ]);
    return (
        (isProPlanOrHigher(subscriptionData?.plan) && subscriptionData?.status === "ACTIVE") ||
        isProPlanOrHigher(permissionsData?.manualPlan)
    );
};

// returns the event to send for this fulfillment, or null when nothing new happened.
// a transaction so two orders/updated webhooks arriving together can't both send the same event
const getFulfillmentEvent = async (shop: string, orderId: string, fulfillment: any) => {
    const docRef = firestore.collection("fulfillmentNotifications").doc(`${shop}_${orderId}_${fulfillment.id}`);
    const trackingKey = getTrackingKey(fulfillment);

    return firestore.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const record = {
            shop,
            orderId,
            fulfillmentId: String(fulfillment.id),
            trackingKey,
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + RECORD_TTL_DAYS * DAY_MS),
        };

        if (!snap.exists) {
            tx.set(docRef, record);
            return "fulfillment_created";
        }

        if (trackingKey && trackingKey !== snap.data()?.trackingKey) {
            tx.set(docRef, record);
            return "tracking_updated";
        }

        return null;
    });
};

// orders/updated fires on every order change, so only new fulfillments and tracking changes are published
export async function processOrderFulfillments(payload: any, shop: string) {
    const fulfillments = (payload?.fulfillments || []).filter(
        (fulfillment: any) => !SKIPPED_STATUSES.includes(fulfillment?.status) && isRecentFulfillment(fulfillment)
    );
    if (!fulfillments.length) return;

    const settings = await fireStoreFetchService("settings", shop);
    if (!settings?.isFulfillmentMessageActivated) return;

    if (!(await hasActiveProPlan(shop))) {
        console.log(`[ORDERS_UPDATED] Skipped - ${shop} is not on Pro or higher`);
        return;
    }

    const orderId = String(payload.id);
    for (const fulfillment of fulfillments) {
        const eventType = await getFulfillmentEvent(shop, orderId, fulfillment);
        if (!eventType) continue;

        await publishMessagePubSubService(TOPIC_NAME, JSON.stringify(
            buildFulfillmentMessage(payload, shop, eventType, fulfillment)
        ));
        console.log(`[ORDERS_UPDATED] Published ${eventType} - Order: ${orderId}, Fulfillment: ${fulfillment.id}, shop: ${shop}`);
    }
}
