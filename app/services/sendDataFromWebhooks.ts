import { Firestore } from "@google-cloud/firestore";
import db from '../db.server'
import publishMessagePubSubService from "./publishMessagePubSubService";
import fireStoreDeleteService from "./fireStoreDeleteService";
import fireStoreCreateService from "./fireStoreCreateService";
import fireStoreFetchService from "./fireStoreFetchService";

const logger = {
  info: (message: string, data?: any) => {
    // console.log(`[INFO] sendDataFromWebhooks [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    // console.warn(`[WARN] sendDataFromWebhooks [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(`[ERROR] sendDataFromWebhooks [${new Date().toISOString()}] ${message}`, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      additionalData: data ? JSON.stringify(data) : ''
    });
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
      // console.log(`[DEBUG] sendDataFromWebhooks [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
    }
  }
};

const currencySymbols: any = {
  AED: "د.إ",
  AFN: "؋",
  ALL: "L",
  AMD: "֏",
  ANG: "ƒ",
  AOA: "Kz",
  ARS: "$",
  AUD: "$",
  AWG: "ƒ",
  AZN: "₼",
  BAM: "KM",
  BBD: "$",
  BDT: "৳",
  BGN: "лв",
  BHD: ".د.ب",
  BIF: "FBu",
  BMD: "$",
  BND: "$",
  BOB: "Bs.",
  BRL: "R$",
  BSD: "$",
  BTN: "Nu.",
  BWP: "P",
  BYN: "Br",
  BZD: "$",
  CAD: "$",
  CDF: "FC",
  CHF: "CHF",
  CLP: "$",
  CNY: "¥",
  COP: "$",
  CRC: "₡",
  CUP: "$",
  CVE: "$",
  CZK: "Kč",
  DJF: "Fdj",
  DKK: "kr",
  DOP: "$",
  DZD: "د.ج",
  EGP: "£",
  ERN: "Nfk",
  ETB: "Br",
  EUR: "€",
  FJD: "$",
  FKP: "£",
  FOK: "kr",
  GBP: "£",
  GEL: "₾",
  GGP: "£",
  GHS: "₵",
  GIP: "£",
  GMD: "D",
  GNF: "FG",
  GTQ: "Q",
  GYD: "$",
  HKD: "$",
  HNL: "L",
  HRK: "kn",
  HTG: "G",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  IMP: "£",
  INR: "₹",
  IQD: "ع.د",
  IRR: "﷼",
  ISK: "kr",
  JEP: "£",
  JMD: "$",
  JOD: "د.ا",
  JPY: "¥",
  KES: "KSh",
  KGS: "с",
  KHR: "៛",
  KID: "$",
  KMF: "CF",
  KRW: "₩",
  KWD: "د.ك",
  KYD: "$",
  KZT: "₸",
  LAK: "₭",
  LBP: "ل.ل",
  LKR: "Rs",
  LRD: "$",
  LSL: "L",
  LYD: "ل.د",
  MAD: "د.م.",
  MDL: "L",
  MGA: "Ar",
  MKD: "ден",
  MMK: "Ks",
  MNT: "₮",
  MOP: "P",
  MRU: "UM",
  MUR: "₨",
  MVR: "Rf",
  MWK: "MK",
  MXN: "$",
  MYR: "RM",
  MZN: "MT",
  NAD: "$",
  NGN: "₦",
  NIO: "C$",
  NOK: "kr",
  NPR: "₨",
  NZD: "$",
  OMR: "ر.ع.",
  PAB: "B/.",
  PEN: "S/",
  PGK: "K",
  PHP: "₱",
  PKR: "₨",
  PLN: "zł",
  PYG: "₲",
  QAR: "ر.ق",
  RON: "lei",
  RSD: "din",
  RUB: "₽",
  RWF: "FRw",
  SAR: "﷼",
  SBD: "$",
  SCR: "₨",
  SDG: "ج.س.",
  SEK: "kr",
  SGD: "$",
  SHP: "£",
  SLL: "Le",
  SOS: "Sh",
  SRD: "$",
  SSP: "£",
  STN: "Db",
  SYP: "ل.س",
  SZL: "L",
  THB: "฿",
  TJS: "ЅМ",
  TMT: "m",
  TND: "د.ت",
  TOP: "T$",
  TRY: "₺",
  TTD: "$",
  TWD: "NT$",
  TZS: "Sh",
  UAH: "₴",
  UGX: "USh",
  USD: "$",
  UYU: "$U",
  UZS: "лв",
  VES: "Bs.",
  VND: "₫",
  VUV: "VT",
  WST: "T",
  XAF: "FCFA",
  XCD: "$",
  XOF: "CFA",
  XPF: "₣",
  YER: "﷼",
  ZAR: "R",
  ZMW: "ZK",
  ZWL: "$",
}

const firestoreDatabase = new Firestore();
const checkoutCollection = firestoreDatabase.collection('users');

const getFirestoreData = async (collectionName: string, storeId: string) => {
  try {
    logger.debug(`Fetching Firestore data`, { collectionName, storeId });
    const getDocData = await fireStoreFetchService(collectionName, storeId);

    if (getDocData) {
      logger.debug(`Successfully retrieved Firestore data`, { collectionName, storeId });
      return { success: true, data: getDocData };
    }

    logger.warn(`Document not found in Firestore`, { collectionName, storeId });
    return { success: false, message: `Connect Page Collection doesn't have the ${storeId} doc present in it` };
  } catch (error) {
    logger.error(`Failed to retrieve Firestore data`, error, { collectionName, storeId });
    throw new Error("Failed to retrieve Firestore data");
  }
}

const handleOldCheckout = async (checkout: any, shop: string, token: string, session: any) => {
  const checkoutId = checkout.checkoutId;
  logger.info(`Processing old checkout`, { checkoutId, shop });
  
  try {
    const recentOrders = await fetchOrders(shop, token);
    const shopDomain = await getShopDomain(shop, token);
    
    if (!shopDomain) {
      logger.warn(`Failed to retrieve shop domain`, { shop, checkoutId });
    }
    
    const orderExists = recentOrders.some((order: any) => order.checkout_id === checkoutId);
    logger.debug(`Checked if order exists for checkout`, { checkoutId, orderExists });

    if (orderExists) {
      logger.info(`Order exists for checkout, deleting records`, { checkoutId, shop });
      await fireStoreDeleteService("users", String(checkoutId));
      await fireStoreDeleteService("checkoutUpdateData", String(checkoutId));
      logger.info(`Successfully deleted checkout records`, { checkoutId });
    } else {
      logger.info(`Checkout is abandoned`, { checkoutId, shop });

      const checkoutUpdateDoc = await fireStoreFetchService("checkoutUpdateData", checkoutId.toString());
      logger.debug(`Retrieved checkout update document`, { checkoutId, docExists: !!checkoutUpdateDoc });

      if (checkoutUpdateDoc) {
        const getGreenAPIData = await getFirestoreData("ConnectPagedata", shop);
        logger.debug(`Retrieved Green API data`, { shop, dataExists: getGreenAPIData.success });

        let objj: any = {};
        objj = checkoutUpdateDoc;
        objj["SHOP DOMAIN"] = shopDomain;

        if (getGreenAPIData.success == true) {
          logger.info(`Green API data found, proceeding with data submission`, { shop, checkoutId });
          objj["Green API ID"] = getGreenAPIData.data;

          await sendDataToPubSub(objj);
          await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
          await setsubscriptionAbandonedCarts(objj);
          logger.info(`Successfully processed abandoned checkout`, { checkoutId, shop });
        } else {
          logger.info(`No Green API data found, sending data without it`, { shop, checkoutId });
          await sendDataToPubSub(objj);
          await handleAddAbandonedCheckouts(checkoutId.toString(), shop, objj);
          await setsubscriptionAbandonedCarts(objj);
          logger.info(`Successfully processed abandoned checkout without Green API data`, { checkoutId, shop });
        }
      } else {
        logger.warn(`No checkout update document found, skipping data submission`, { checkoutId });
      }

      await fireStoreDeleteService("users", String(checkoutId));
      await fireStoreDeleteService("checkoutUpdateData", String(checkoutId));
      logger.info(`Cleanup completed for checkout`, { checkoutId });
    }
  } catch (error) {
    logger.error(`Error handling old checkout`, error, { checkoutId, shop });
  }
}

const sendDataToPubSub = async (message: any) => {
  const shopDomain = message?.["SHOP DOMAIN"];
  logger.info(`Publishing message to PubSub`, { shopDomain, topicName: "NewAbandonedCheckout" });
  
  try {
    const messageJson = JSON.stringify(message);
    await publishMessagePubSubService("NewAbandonedCheckout", messageJson);
    logger.info(`Successfully published message to PubSub`, { shopDomain });
  } catch (err) {
    logger.error(`Error publishing message to PubSub`, err, { shopDomain, topicName: "NewAbandonedCheckout" });
  }
}

const fetchOrders = async (shopName: string, token: string) => {
  const lastTenMinuteTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  logger.debug(`Fetching orders from Shopify`, { shopName, since: lastTenMinuteTime });
  
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

    if (!response.ok) {
      logger.error(`Failed to fetch orders from Shopify`, new Error(`HTTP ${response.status}`), { shopName });
      return [];
    }

    const responseData = await response.json();
    const orderCount = Array.isArray(responseData?.orders) ? responseData.orders.length : 0;
    logger.debug(`Successfully fetched orders from Shopify`, { shopName, count: orderCount });
    
    return Array.isArray(responseData?.orders) ? responseData.orders : [];
  } catch (error) {
    logger.error(`Error fetching orders from Shopify`, error, { shopName });
    return [];
  }
}

const getShopDomain = async (shopName: string, token: string) => {
  logger.debug(`Fetching shop domain from Shopify`, { shopName });
  
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

    if (!response.ok) {
      logger.error(`Failed to fetch shop domain - HTTP error`, new Error(`HTTP ${response.status}`), { shopName });
      return '';
    }

    const responseData = await response.json();
    
    if (responseData.errors) {
      logger.error(`GraphQL error while fetching shop domain`, new Error(JSON.stringify(responseData.errors)), { shopName });
      return '';
    }
    
    const domain = responseData.data?.shop?.primaryDomain?.host;
    if (!domain) {
      logger.warn(`Shop domain not found in response`, { shopName });
      return '';
    }
    
    logger.debug(`Successfully fetched shop domain`, { shopName, domain });
    return domain;
  } catch (error) {
    logger.error(`Error fetching domain from Shopify`, error, { shopName });
    return '';
  }
}

export const sendDataFromWebhooks = async () => {
  logger.info(`Cron Job Started`);

  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    logger.debug(`Querying checkouts older than`, { tenMinutesAgo });
    
    const oldCheckoutsQuerySnapshot = await checkoutCollection.where("createdAt", "<=", tenMinutesAgo).get();

    logger.info(`Found old checkouts in Firestore`, { count: oldCheckoutsQuerySnapshot.size });

    oldCheckoutsQuerySnapshot?.forEach(async (doc) => {
      const checkout = doc.data();
      const storeId = checkout?.storeId;
      
      try {
        logger.debug(`Processing checkout document`, { storeId, checkoutId: checkout?.checkoutId });
        
        const session = await db.session.findFirst({ where: { shop: checkout.storeId } });

        if (session) {
          logger.debug(`Session found for store`, { storeId });
          await handleOldCheckout(checkout, session.shop, session.accessToken, session);
        } else {
          logger.warn(`Session not found in database`, { storeId });
        }
      } catch (error) {
        logger.error(`Error processing checkout document`, error, { storeId, checkoutId: checkout?.checkoutId });
      }
    });

    logger.info(`Cron Job Completed`);
  } catch (error) {
    logger.error(`Error in sendDataFromWebhooks cron job`, error);
  }
}

export const setAppInstalledDate = async (session: any, data: any) => {
  logger.debug(`Setting app installed date`, { shop: session.shop });
  try {
    await fireStoreCreateService("AppInstalledDate", session.shop, data, { merge: true });
    logger.info(`App installed date set successfully`, { shop: session.shop });
  } catch (error) {
    logger.error(`Error setting app installed date`, error, { shop: session.shop });
    throw error;
  }
}

export const getAppInstalledDate = async (session: any) => {
  logger.debug(`Retrieving app installed date`, { shop: session.shop });
  try {
    const doc = await fireStoreFetchService("AppInstalledDate", session.shop);
    if (!doc) {
      logger.debug(`No app installed date found`, { shop: session.shop });
      return null;
    }
    logger.debug(`App installed date retrieved`, { shop: session.shop });
    return doc;
  } catch (error) {
    logger.error(`Error retrieving app installed date`, error, { shop: session.shop });
    throw error;
  }
}

export const getSubscriptionsData = async (session: any) => {
  logger.debug(`Retrieving subscriptions data`, { shop: session.shop });
  try {
    const doc = await fireStoreFetchService("subscriptions", session.shop);
    if (!doc) {
      logger.debug(`No subscriptions data found`, { shop: session.shop });
      return null;
    }
    logger.debug(`Subscriptions data retrieved`, { shop: session.shop });
    return doc;
  } catch (error) {
    logger.error(`Error retrieving subscriptions data`, error, { shop: session.shop });
    throw error;
  }
}

const setsubscriptionAbandonedCarts = async (data: any) => {
  logger.debug(`Adding subscription abandoned cart record`);
  try {
    const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
    const cleanedData = replaceUndefined(data);
    await collection.add(cleanedData);
    logger.debug(`Subscription abandoned cart record added successfully`);
  } catch (error) {
    logger.error(`Error adding subscription abandoned cart record`, error);
  }
}

export const checkMatching = async (session: any) => {
  logger.info(`Checking matching carts`, { shop: session.shop });
  
  try {
    return {
      success: true
    }
    const collection = firestoreDatabase.collection('subscriptionAbandonedCarts');
    const subscriptionQuerySnapshot = await collection.where("STORE_ID", "==", session.shop).get();
    logger.debug(`Found subscription abandoned carts`, { shop: session.shop, count: subscriptionQuerySnapshot.size });

    if (subscriptionQuerySnapshot.empty) {
      logger.info(`No subscription abandoned carts found`, { shop: session.shop });
      return { data: 'No subscriptionAbandonedCarts found', status: true };
    }
    
    const recoveredCarts = await getAbandonedCarts(session);
    logger.debug(`Found recovered carts`, { shop: session.shop, count: recoveredCarts?.length || 0 });

    for (const doc of subscriptionQuerySnapshot.docs) {
      const docData = doc.data();
      const checkoutId = docData?.UpdateData?.id || docData?.checkoutId || docData?.id || null;
      logger.debug(`Processing cart for matching`, { checkoutId });

      if (recoveredCarts?.length > 0) {
        const matchedCart = recoveredCarts.find(c => c.id == checkoutId);

        if (matchedCart) {
          let limit = 0;
          const subscriptionData = await getSubscriptionsData(session);
          const plan = subscriptionData?.plan;
          logger.debug(`Checking limits for plan`, { plan });

          if (plan === 'Starter') limit = 10;
          else if (plan === 'Pro') limit = 49;
          else if (plan === 'Advance') limit = 100;

          const recoveredCount = recoveredCarts.length;
          logger.info(`Comparing recovered carts with limit`, { plan, limit, recoveredCount });

          if (recoveredCount >= limit) {
            logger.warn(`Limit exceeded for plan`, { plan, limit, recoveredCount });
            return { data: 'Limit exceeded', status: false };
          } else {
            logger.info(`Limit not exceeded`, { plan, limit, recoveredCount });
            return { data: 'Limit not exceeded', status: true };
          }
        }
      } else {
        logger.info(`No recovered carts found`, { shop: session.shop });
        return { data: 'No recovered carts', status: true };
      }
    }

    logger.info(`No matching carts found`, { shop: session.shop });
    return { data: 'No matching carts or limit not exceeded', status: true };

  } catch (error) {
    logger.error(`Error checking matching carts`, error, { shop: session.shop });
    return { success: false, error: true }
  }
}

export const getAbandonedCarts = async (session: any) => {
  let allCheckouts: any = [];
  let lastId = null;
  
  logger.info(`Fetching abandoned carts for store`, { shop: session.shop });

  try {
    do {
      logger.debug(`Fetching checkouts batch`, { shop: session.shop, lastId });
      
      const response: any = await fetch(
        `https://${session.shop}/admin/api/2024-10/checkouts.json?limit=250${lastId ? `&since_id=${lastId}` : ''}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": session.accessToken,
          },
        }
      );
      
      if (!response.ok) {
        logger.error(`Failed to fetch checkouts - HTTP error`, new Error(`HTTP ${response.status}`), { shop: session.shop });
        break;
      }

      const responseData = await response.json();
      const checkouts = responseData.checkouts;
      
      logger.debug(`Fetched checkouts batch`, { shop: session.shop, count: checkouts?.length || 0 });

      if (checkouts?.length > 0) {
        allCheckouts = [...allCheckouts, ...checkouts];
        lastId = checkouts[checkouts.length - 1].id;
      } else {
        logger.debug(`No more checkouts to fetch`, { shop: session.shop });
        break;
      }

    } while (lastId);

    logger.debug(`Total checkouts fetched`, { shop: session.shop, count: allCheckouts.length });

    const subscriptionData = await getSubscriptionsData(session);
    const referenceDateStr = subscriptionData?.startDate;
    
    if (!referenceDateStr) {
      logger.warn(`No reference date found for subscription`, { shop: session.shop });
      return [];
    }

    const referenceDate = new Date(referenceDateStr);
    logger.debug(`Filtering checkouts by reference date`, { referenceDate });

    const filteredAbandonedCheckouts = allCheckouts?.filter(item => {
      if (item?.created_at) {
        const createdAtDate = new Date(item?.created_at);
        return createdAtDate > referenceDate;
      }
      return false;
    });

    logger.debug(`Filtered abandoned checkouts`, { count: filteredAbandonedCheckouts?.length || 0 });

    const recoveredCarts = filteredAbandonedCheckouts.filter(item => item?.completed_at !== null);
    logger.info(`Found recovered carts`, { shop: session.shop, count: recoveredCarts.length });

    return recoveredCarts;

  } catch (error) {
    logger.error(`Error fetching abandoned carts`, error, { shop: session.shop });
    return [];
  }
}

export const sendDataAppInstallTopicPubSub = async (message: any) => {
  logger.info(`Publishing app install message to PubSub`);
  try {
    await publishMessagePubSubService("install", JSON.stringify(message));
    logger.info(`Successfully published app install message`);
  } catch (err) {
    logger.error(`Error publishing app install message`, err);
  }
}

export const deleteConnectPageDataFromFirestore = async (storeId: string) => {
  logger.info(`Deleting connect page data from Firestore`, { storeId });
  try {
    await fireStoreDeleteService("ConnectPagedata", storeId);
    logger.info(`Successfully deleted connect page data`, { storeId });
  } catch (error) {
    logger.error(`Error deleting connect page data`, error, { storeId });
  }
}

async function storeSubscriptionActive(storeId: string) {
  logger.debug(`Checking if store subscription is active`, { storeId });
  
  try {
    const doc = await fireStoreFetchService("subscriptions", storeId);

    if (!doc) {
      logger.warn(`Store subscription document does not exist`, { storeId });
      return { success: false, message: "Store Subscription document does not exist." };
    } else {
      if (doc.status == "ACTIVE") {
        logger.info(`Store subscription is active`, { storeId });
        return { success: true, data: doc };
      } else {
        logger.warn(`Store subscription status is not active`, { storeId, status: doc.status });
        return { success: false, message: "Store Subscription Status is NOT SET TO ACTIVE" };
      }
    }
  } catch (error) {
    logger.error(`Error checking store subscription status`, error, { storeId });
    return { success: false, message: "Error checking subscription status", error: error };
  }
}

async function handleAddAbandonedCheckouts(checkoutId: string, storeId: string, payload: any) {
  logger.debug(`Adding abandoned checkout record`, { checkoutId, storeId });
  
  try {
    const customerId = payload?.UpdateData?.customer?.admin_graphql_api_id ?? null;
    const cleanedPayload = replaceUndefined(payload);
    
    await fireStoreCreateService("AbandonedCheckoutsData", checkoutId, {
      storeId,
      checkoutId,
      customerId,
      payload: cleanedPayload,
      createdAt: new Date()
    }, {});
    
    logger.info(`Successfully added abandoned checkout record`, { checkoutId, storeId });
  } catch (error) {
    logger.error(`Error adding abandoned checkout record`, error, { checkoutId, storeId });
  }
}

export async function getShopDetails(admin: any) {
  logger.info(`Fetching shop details`);
  
  try {
    const response = await admin?.graphql(`query {
      shop {
        email
        createdAt
        currencyCode
        billingAddress {
          country
          phone
        }
      }
    }`);

    if (response.status !== 200 || !response.ok) {
      logger.error(`Failed to fetch shop details - HTTP error`, new Error(`HTTP ${response.status}`));
      return { success: false };
    }

    const responseJson = await response.json();
    const shopData = responseJson.data.shop;
    
    if (!shopData) {
      logger.error(`No shop data in response`);
      return { success: false };
    }

    logger.debug(`Fetched shop data, starting to fetch orders`);

    let hasNextPage = null;
    let endCursor = null;
    let totalOrdersCount = 0;
    let totalOrdersSum = 0;
    const getAllOrders = [];
    let pageCount = 0;

    while (hasNextPage != false) {
      pageCount++;
      logger.debug(`Fetching orders page`, { pageCount });
      
      let query: string = `query {
        ${hasNextPage != null ? `orders(first: 50, after: "${endCursor}") {` : `orders(first: 50) {`}
          edges {
            node {
              originalTotalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
          pageInfo{
            hasNextPage
            endCursor
          }
        }
      }`;

      let getOrders = await admin?.graphql(query);

      if (getOrders.status !== 200 || !getOrders.ok) {
        logger.error(`Failed to fetch orders - HTTP error`, new Error(`HTTP ${getOrders.status}`));
        break;
      }

      let getOrdersJson = await getOrders.json();

      if (getOrdersJson.errors) {
        logger.error(`GraphQL error while fetching orders`, new Error(JSON.stringify(getOrdersJson.errors)));
        break;
      }

      getAllOrders.push(...getOrdersJson.data.orders.edges);
      hasNextPage = getOrdersJson.data.orders.pageInfo.hasNextPage;
      endCursor = getOrdersJson.data.orders.pageInfo.endCursor;
      logger.debug(`Fetched orders batch`, { ordersInBatch: getOrdersJson.data.orders.edges.length, hasNextPage });
    }

    for (let i = 0; i < getAllOrders.length; i++) {
      totalOrdersSum += Number(getAllOrders[i].node.originalTotalPriceSet.shopMoney.amount);
      totalOrdersCount++;
    }

    logger.info(`Successfully fetched shop details`, { totalOrdersCount, totalOrdersSum });

    return {
      success: true,
      email: shopData.email,
      phone: shopData.billingAddress.phone,
      country: shopData.billingAddress.country,
      currency: currencySymbols[shopData.currencyCode] ?? null,
      ordersCount: totalOrdersCount,
      ordersSum: totalOrdersSum.toFixed(2),
      createdAt: shopData.createdAt
    }
  } catch (error) {
    logger.error(`Error fetching shop details`, error);
    return { success: false };
  }
}


function replaceUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(replaceUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = value === undefined ? "N/A" : replaceUndefined(value);
    }
    return result;
  } else {
    return obj;
  }
}
