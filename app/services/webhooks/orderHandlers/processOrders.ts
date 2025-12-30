import { firestore } from "~/utils/firestore.server";
import { Timestamp } from "@google-cloud/firestore";

export async function processCKSales(payload: any, shop: string) {
  // console.log(
  //   "ORDERS_CREATE webhook triggered:",
  //   payload?.id,
  //   "shop =>",
  //   shop,
  //   "payload =>",
  //   JSON.stringify(payload)
  // );

  const ckLineItems = payload.line_items.filter(
    (item: any) =>
      item.properties &&
      item.properties.some(
        (prop: any) => prop.name === "_source" && prop.value === "ck_ai_chat"
      )
  );

  if (!ckLineItems.length) {
    console.log("No CK AI Chat orders found");
    return;
  }

  const orderId = String(payload.id);

  const shopDocRef = firestore
    .collection("salesFromAIChatbot")
    .doc(shop);

  const orderDocRef = shopDocRef
    .collection("orders")
    .doc(orderId);

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(orderDocRef);
    if (snap.exists) return; 

    tx.set(
      shopDocRef,
      {
        lastUpdatedAt: Timestamp.now(),
        shop,
      },
      { merge: true }
    );

    tx.set(orderDocRef, {
      id: payload.id,
      order_name: payload.name,
      total_price: payload.total_price,
      currency: payload.currency,
      created_at: payload.created_at,
      customer: {
        id: payload.customer?.id,
        email: payload.customer?.email,
        phone: payload.customer?.phone,
      },
      filtered_line_items: ckLineItems,
      source: "ck_ai_chat",
    });
  });

  console.log(`Saved CK AI Chat order ${orderId} for shop ${shop}`);
}
