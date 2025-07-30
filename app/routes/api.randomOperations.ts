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
import { Firestore, Timestamp } from "@google-cloud/firestore";
// import fs from 'fs';
// import path from 'path';
// const firestoreDatabase = new Firestore();

// export async function loader({ request }) {
//     const firestoreDatabase = new Firestore();
//     const checkoutCollection = firestoreDatabase.collection('users');
//     const oldCheckoutsQuerySnapshot = await checkoutCollection.get();
//     const dataJson: any = [];
//     try {
//         console.log("oldCheckoutsQuerySnapshot.size", oldCheckoutsQuerySnapshot.size);
//         oldCheckoutsQuerySnapshot?.forEach(async (doc) => {
//             const checkout = doc.data();
//             dataJson.push(checkout);
//         })
//         const filePath = path.join(process.cwd(), 'public', 'users_data_jan-4-11:51PM.json');
//         // console.log("data=============>", dataJson);
//         fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
//         console.log('Data saved to users_data.json');
//         return {}
//     } catch (error) {
//         console.log("ERROR", error);
//         return false;
//     }
// }


// import fs from 'fs';
// import path from 'path';
// async function collectionDataCount() {
//   let dataCount: any = {};
//   let overAllCount = 0;
//   try {
//     const salesTaggingCollection = firestoreDatabase.collection('sales');
//     const salesTaggingCollectionDocuments = await salesTaggingCollection.get();
//     console.log("salesTaggingCollectionDocuments count", salesTaggingCollectionDocuments.size);

//     for (const doc of salesTaggingCollectionDocuments.docs) {
//       const sales = doc.data();

//       if (!dataCount[doc.id]) {
//         dataCount[doc.id] = 0;
//       }

//       for (const saleId in sales) {
//         dataCount[doc.id] += 1;
//         overAllCount++;
//       }
//     }
//     console.log("dataCount", dataCount);
//     console.log("overAllCount", overAllCount);
//     return { success: true, collection: "sales", dataCount, overAllCount };
//   } catch (error) {
//     console.log("ERROR on collectionDataCount", error);
//     return { success: false };
//   }
// }


// export async function loader({ request }: any) {
// for counting a collection
// const data = await collectionDataCount()
// return data




// for copying a data from one collection to another.
// const firestoreDatabase = new Firestore();
// const salesCollection = firestoreDatabase.collection('sales');
// const salesTaggingCollection = firestoreDatabase.collection('SalesTagging');
// try {
//   const querySnapshot = await salesCollection.get();
//   console.log("QuerySnapshot.size", querySnapshot.size);
//   if (querySnapshot.empty) {
//     console.log("No sales data found.");
//     return {};
//   }
//   let batch = firestoreDatabase.batch();
//   let writeCount = 0;
//   console.log("STARTED A PROCESS OF COPING ONE COLLECTION TO ANOTHER.")
//   for (const doc of querySnapshot.docs) {
//     const newDocRef = salesTaggingCollection.doc(doc.id); // maintaining same ID
//     batch.set(newDocRef, doc.data());
//     writeCount++;

//     // commiting batch every 500 writes necause write batch only allows maximum 500 writes per batch.
//     if (writeCount >= 500) {
//       console.log("Intermediate committing of batch operation...");
//       await batch.commit();
//       batch = firestoreDatabase.batch(); // starting a new batch
//       writeCount = 0;
//     }
//   }
//   // commit remaining writes if any is there
//   if (writeCount > 0) {
//     console.log("Final committing of batch operation...");
//     await batch.commit();
//   }
//   console.log("All sales data copied to SalesTagging collection.");
//   return { success: true };
// } catch (error) {
//   console.error("ERROR copying sales data:", error);
//   return { success: false, error };
// }




// for storing all the collection data in a json file
// const collection = firestoreDatabase.collection('CheckoutsUpdate');
// const QuerySnapshot = await collection.get();
// const dataJson: any = [];
// try {
//   console.log("QuerySnapshot.size", QuerySnapshot.size);
//   QuerySnapshot?.forEach(async (doc) => {
//     const data = doc.data();
//     const dataWithId = { id: doc.id, ...data };
//     dataJson.push(dataWithId);
//   })

//   const filePath = path.join(process.cwd(), 'public', 'CheckoutsUpdate_data_mar-20_12:33.json');
//   // console.log("data=============>", dataJson);
//   fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2));
//   console.log('Data saved to CheckoutsUpdate json');
//   return {}
// } catch (error) {
//   console.log("ERROR on storing all the collection data in a json file", error);
//   return false;
// }

// for checking each document field and updating if its wrong
// const collection = firestoreDatabase.collection('settings');
// try {
//   const followUpMessageDurations = ['After 24 hours', 'After 48 hours'];
//   const querySnapshot = await collection.get();
//   const batch = firestoreDatabase.batch();
//   console.log("QuerySnapshot.size", querySnapshot.size);
//   for (const doc of querySnapshot.docs) {
//     const data = doc.data();
//     if (doc.id === "sprecoverymonkey.myshopify.com") {
//       console.log("doc.id==========>  ", doc.id);
//       const durationToSendFollowUpMessage = data.durationToSendFollowUpMessage;
//       if (!followUpMessageDurations.includes(durationToSendFollowUpMessage)) {
//         const settingDocRef = firestoreDatabase.collection('settings').doc(doc.id);
//         batch.update(settingDocRef, {
//           durationToSendFollowUpMessage: "After 24 hours"
//         });
//       }
//     }

//   }
//   await batch.commit();
//   console.log('Data updated');
//   return {};
// } catch (error) {
//   console.log("ERROR on updating the settings data", error);
//   return false;
// }



// for orders tagging
// const url = 'https://sprecoverymonkey.myshopify.com/admin/api/2025-01/graphql.json';
// const accessToken = '';  // Replace with your actual access token
// const headers = {
//     'Content-Type': 'application/json',
//     'X-Shopify-Access-Token': accessToken
// };
// const body = JSON.stringify({
//     query: `
// mutation updateOrderMetafields($input: OrderInput!) { 
//   orderUpdate(input: $input) { 
//     order { 
//       id 
//       metafields(first: 3) { 
//         edges { 
//           node { 
//             id 
//             namespace 
//             key 
//             value 
//           } 
//         } 
//       } 
//     } 
//     userErrors { 
//       message 
//       field 
//     } 
//   } 
// }`,
//     variables: {

//         "input": {
//             "id": "gid://shopify/Order/6042130284795",
//             "tags": "👍Profit by CartKeeper"
//         }
//     }
// });
// let dataaa;
// fetch(url, {
//     method: 'POST',
//     headers: headers,
//     body: body
// })
//     .then(response => response.json())
//     .then(data => {
//         console.log('Success============>:', data);
//         dataaa = data
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });



// for fetching customers in pagination, filter and soring
// const {
//   filterField = "active",
//   filterValue = false,
//   search = '',
//   limit = 10,
//   startAfter = '',   // For next page cursor (email)
//   prevCursor = '',   // For previous page cursor (email)
//   paginationDirection = 'next'
// } = {};
// const storeId = "sprecoverymonkey.myshopify.com";

// // building the base query for the store's customers subcollection.
// let query: any = firestoreDatabase
//   .collection('storeCustomers')
//   .doc(storeId)
//   .collection('customers');

// // applying filteringd if selected.
// if (filterField && String(filterValue)) {
//   query = query.where(filterField, '==', filterValue);
// }

// // applyoing a prefix search on the 'name' field if specified.
// if (search) {
//   query = query.where('name', '>=', search)
//     .where('name', '<=', search + '\uf8ff');
// }

// // ordering by the 'email' field so that we can use it as the pagination cursor.
// query = query.orderBy('email');

// // applying a pagination based on the direction.
// if (paginationDirection === 'next') {
//   // for next page, using a startAfter (if provided) and limit.
//   if (startAfter) {
//     query = query.startAfter(startAfter);
//   }
//   query = query.limit(parseInt(limit));
// } else if (paginationDirection === 'prev') {
//   // for previous page, using endBefore with limitToLast.
//   if (prevCursor) {
//     query = query.endBefore(prevCursor);
//   }
//   query = query.limitToLast(parseInt(limit));
// }

// // executing a the query.
// const snapshot = await query.get();
// const customers: any = [];
// snapshot.forEach((doc) => {
//   customers.push({ id: doc.id, ...doc.data() });
// });

// // extracting a cursors for further pagination.
// // using the 'email' field from the first and last documents.
// const docs = snapshot.docs;
// const firstDoc = docs[0];
// const lastDoc = docs[docs.length - 1];
// const nextCursor = lastDoc ? lastDoc.get('email') : null;
// const prevCursorOut = firstDoc ? firstDoc.get('email') : null;

// // returning the results along with pagination cursors.
// return {
//   customers,
//   nextCursor,   // for next page requests, send this as 'startAfter'
//   prevCursor: prevCursorOut  // for previous page requests, send this as 'prevCursor'
// };


// for deleting a data from AbandonedCheckoutsData collection older then 48 hours.



// }

// export async function loader({ request }: any) {
//   console.log("STARTED archiving and deleting AbandonedCheckoutsData older than 48 hours.");

//   const firestoreDatabase = new Firestore();
//   const FETCH_LIMIT = 100;
//   const BATCH_LIMIT = 100;

//   const now = new Date();
//   const twoDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 48); // 48 hours ago

//   let lastDoc = null;
//   let totalArchived = 0;

//   try {
//     while (true) {
//       let query = firestoreDatabase
//         .collection("AbandonedCheckoutsData")
//         .where("createdAt", "<", twoDaysAgo)
//         .orderBy("createdAt")
//         .limit(FETCH_LIMIT);

//       if (lastDoc) {
//         query = query.startAfter(lastDoc);
//       }

//       const snapshot = await query.get();
//       if (snapshot.empty) break;

//       const docs = snapshot.docs;
//       lastDoc = docs[docs.length - 1];

//       for (let i = 0; i < docs.length; i += BATCH_LIMIT) { // this and next line to make sure we don't exceed Firestore's batch limit if by mistake fetch limit is more than batch limit.
//         const chunk = docs.slice(i, i + BATCH_LIMIT);
//         const batch = firestoreDatabase.batch();

//         chunk.forEach((doc) => {
//           const data = doc.data();
//           const archiveRef = firestoreDatabase.collection("ArchivedAbandonedCheckoutsData").doc(doc.id);
//           const sourceRef = firestoreDatabase.collection("AbandonedCheckoutsData").doc(doc.id);

//           batch.set(archiveRef, data);
//           batch.delete(sourceRef);
//         });

//         try {
//           await batch.commit();
//           totalArchived += chunk.length;
//           console.log(`archived & deleted ${totalArchived} so far...`);
//         } catch (batchError) {
//           console.error("error in batch commiit:", batchError);
//         }
//       }
//     }

//     console.log(`completed archived and deleted total of ${totalArchived} documents.`);
//   } catch (outerError) {
//     console.error("outside  loop failed:", outerError);
//   }
// }

// This code updates the customerId at the top level for recent checkouts in the AbandonedCheckoutsData collection.
// export async function loader({ request }: any) {
//   console.log("STARTED: Updating customerId at top level for recent checkouts...");

//   const firestoreDatabase = new Firestore();
//   const today = new Date();
//   const twoDaysAgo = new Date(today.getTime() - 1000 * 60 * 60 * 48); // 48 hours ago

//   try {
//     const getCollection = firestoreDatabase.collection("AbandonedCheckoutsData");
//     const snapshot = await getCollection.where("createdAt", ">=", twoDaysAgo).get();

//     console.log("Documents found:", snapshot.size);

//     let totalUpdated = 0;
//     let processedCount = 0;

//     let batch = firestoreDatabase.batch();
//     let batchCount = 0;

//     for (const doc of snapshot.docs) {
//       const docData = doc.data();
//       const nestedCustomerId = docData?.payload?.UpdateData?.customer?.admin_graphql_api_id ?? null;
//       const docRef = firestoreDatabase.collection("AbandonedCheckoutsData").doc(doc.id);

//       batch.update(docRef, { customerId: nestedCustomerId });
//       batchCount++;
//       totalUpdated++;
//       processedCount++;

//       if (processedCount % 100 === 0) {
//         console.log(`processed ${processedCount} documents so far ...`);
//         console.log(`committing batch for this nestedCustomerId: ${nestedCustomerId}`);
//       }

//       if (batchCount === 500) {
//         await batch.commit();
//         console.log(`committed batch of 500 documents.`);
//         batch = firestoreDatabase.batch();
//         batchCount = 0;
//       }
//     }

//     if (batchCount > 0) {
//       await batch.commit();
//       console.log(`total batch commiitted (${batchCount} documents).`);
//     }

//     console.log(`done total updated: ${totalUpdated}`);
//     return { success: true, updatedCount: totalUpdated };
//   } catch (error) {
//     console.error("error updating documents", error);
//     return { success: false };
//   }
// }



// to send missed data of appinstalled date to pubsub and firestore
// import fireStoreCreateService from "~/services/fireStoreCreateService";
// import { sendDataAppInstallTopicPubSub, setAppInstalledDate } from "~/services/sendDataFromWebhooks";

// export const loader = async ({ request }: { request: Request }) => {
//   try {
//     const shop = "8d68ca-su.myshopify.com"
//     const accessToken = ""
//     const dateToSave = 'July 24, 2025 01:12:00'

//     const query = `{
//         shop {
//         email
//         createdAt
//         currencyCode
//         billingAddress {
//           country
//           phone
//         }
//   }}
//       `;

//     const response = await fetch(`https://${shop}/admin/api/2025-07/graphql.json`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Shopify-Access-Token": accessToken,
//       },
//       body: JSON.stringify({ query }),
//     });
//     const json = await response.json();

//     if (!response.ok || json.errors) {
//       console.error("GraphQL error:", json.errors || json);
//       return new Response("failed to fetch Shopify orders", {
//         status: response.status,
//       });
//     }
//     const shopData = json.data.shop;

//     if (shopData) {
//       let hasNextPage = null;
//       let endCursor = null;
//       let totalOrdersCount = 0;
//       let totalOrdersSum = 0;
//       const getAllOrders = [];

//       while (hasNextPage != false) {
//         let query: string = `{
//             ${hasNextPage != null ? `orders(first: 50, after: "${endCursor}") {` : `orders(first: 50) {`}
//               edges {
//                 node {
//                   originalTotalPriceSet {
//                     shopMoney {
//                       amount
//                     }
//                   }
//                 }
//               }
//               pageInfo{
//                 hasNextPage
//                 endCursor
//               }
//       }}
//           `;


//         const responseOrders = await fetch(`https://${shop}/admin/api/2025-07/graphql.json`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "X-Shopify-Access-Token": accessToken,
//           },
//           body: JSON.stringify({ query }),
//         });
//         const jsonOrder = await responseOrders.json();

//         if (!responseOrders.ok || jsonOrder.errors) {
//           console.error("GraphQL error:", jsonOrder.errors || jsonOrder);
//           return new Response("failed to fetch Shopify orders", {
//             status: responseOrders.status,
//           });
//         }

//         const getOrdersJson = jsonOrder;

//         getAllOrders.push(...getOrdersJson.data.orders.edges);
//         hasNextPage = getOrdersJson.data.orders.pageInfo.hasNextPage;
//         endCursor = getOrdersJson.data.orders.pageInfo.endCursor;
//       }

//       for (let i = 0; i < getAllOrders.length; i++) {
//         totalOrdersSum += Number(getAllOrders[i].node.originalTotalPriceSet.shopMoney.amount);
//         totalOrdersCount++;
//       }

//       const data: any = {
//         appInstalledDate:  Timestamp.fromDate(new Date(dateToSave)),
//         storeId: shop,
//       }


//       data["phone"] = shopData.billingAddress.phone;
//       data["email"] = shopData.email;
//       data["country"] = shopData.billingAddress.country;
//       data["currency"] = currencySymbols[shopData.currencyCode] ?? null;
//       data["ordersCount"] = totalOrdersCount;
//       data["ordersSum"] = totalOrdersSum.toFixed(2);
//       data["shopCreatedAt"] = shopData.createdAt;

//       console.log("data to be stored in AppInstalledDate collection:", data);

//       await fireStoreCreateService("AppInstalledDate", shop, data, { merge: true })
//       await sendDataAppInstallTopicPubSub(data);
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });

//   } catch (error) {
//     console.error("Unexpected error:", error);
//     return new Response("Internal Server Error", {
//       status: 500,
//     });
//   }
// };




