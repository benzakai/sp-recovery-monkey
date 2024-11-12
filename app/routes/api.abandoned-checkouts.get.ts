import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
// import axios from "axios";
// import { getAppInstalledDate } from "~/services/sendDataFromWebhooks";
// import { getRecoveredCartslist } from "~/services/sendDataFromWebhooks";
import { getSubscriptionsData } from "~/services/sendDataFromWebhooks";
// import { checkMatching } from "~/services/sendDataFromWebhooks";
// import { getAbandonedCarts } from "~/services/sendDataFromWebhooks";

const formatDateInCustomFormat = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;

  return formattedDate;
}


// export async function loader({ request }: ActionFunctionArgs) {
//     const { admin, session } = await authenticate.admin(request);
//     const today = new Date();

//     const daysBefore30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
//     const last30Days = formatDateInCustomFormat(daysBefore30);

//     try {

//         // const response = await admin.graphql(`#graphql
//         //     query {
//         //         abandonedCheckouts(first: 10) {
//         //             edges {
//         //                 node {
//         //                     id
//         //                 }
//         //             }
//         //             pageInfo {
//         //                 hasNextPage
//         //                 endCursor
//         //             }
//         //         }
//         //     }
//         // `)

//         // const response = await admin.graphql(
//         //     `#graphql
//         //     query {
//         //         abandonedCheckouts(first: 10, sortKey:CREATED_AT, reverse:true) {
//         //             edges {
//         //             node {
//         //                 id
//         //                 createdAt
//         //                 updatedAt
//         //                 completedAt
//         //                 totalPriceSet {
//         //                 shopMoney {
//         //                     amount
//         //                 }
//         //                 }
//         //                 customer {
//         //                 firstName
//         //                 lastName
//         //                 displayName
//         //                 }
//         //             }
//         //             }
//         //             pageInfo {
//         //                 hasNextPage
//         //                 endCursor
//         //             }
//         //         }
//         //     }`);

//         // const responseJson = await response.json();

//         // console.log("responseJson", responseJson.data);

//         // await axios{}

//         // const response: any = await admin.rest.resources.AbandonedCheckout.checkouts({
//         //     session,
//         //     limit: "5",
//         // });

//         // console.log("response", response);
//         // console.log('response checkouts', response.checkouts);

//         const response = await axios({
//             url: `https://sprecoverymonkey.myshopify.com/admin/api/2024-10/graphql.json`,
//             method: "post",
//             headers: {
//                 "Content-Type": "application/json",
//                 "X-Shopify-Access-Token": session.accessToken,
//             },
//             data: {
//             query: `query {
//                 abandonedCheckouts(first: 10, sortKey:CREATED_AT, reverse:true) {
//                     edges {
//                     node {
//                         id
//                         createdAt
//                         updatedAt
//                         completedAt
//                         totalPriceSet {
//                         shopMoney {
//                             amount
//                         }
//                         }
//                         customer {
//                         firstName
//                         lastName
//                         displayName
//                         }
//                     }
//                     }
//                     pageInfo {
//                     hasNextPage
//                     endCursor
//                     }
//                 }
//                 }
//         ` }});

//         console.log("response", response.data.data);

//         return json({ success: true, data: [] })

//     } catch (error) {
//         console.log("ERROR", error?.body?.errors?.graphQLErrors);
//         return json({ success: false });
//     }
// }

function convertFirestoreTimestampToISO(timestamp) {
  const milliseconds = timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000;
  const date = new Date(milliseconds);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

export async function loader({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const today = new Date();
  const daysBefore30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = formatDateInCustomFormat(daysBefore30);

  // const appInstalledDate = await getAppInstalledDate(session);
  // console.log('appInstalledDate', appInstalledDate?.appInstalledDate);
  // const isoDate = convertFirestoreTimestampToISO(appInstalledDate?.appInstalledDate);
  // console.log('isoDate', isoDate);
  // console.log('type', typeof isoDate);
  // const subscriptionData = await getSubscriptionsData(session);
  // console.log('subscriptionData',subscriptionData);
  // const formattedDate = formatDate(appInstalledDate?.appInstalledDate);
  // console.log('formattedDate', formattedDate); 2024-11-08T10:28:53+05:30   2014-04-25T16:15:47-04:00

  // const data = await getAbandonedCarts(session);
  // console.log('got recovered carts',data);
  

  let allCheckouts = [];
  let lastId = null;

  try {

    
    // Loop to fetch all checkouts in batches of 250
    do {
      const response = await admin.rest.resources.AbandonedCheckout.checkouts({
        session,
        // created_at_min: isoDate,
        limit: "250",
        ...(lastId && { since_id: lastId })
      });

      const checkouts = response.checkouts;
      allCheckouts = [...allCheckouts, ...checkouts];

      if (checkouts.length > 0) {
        // Set lastId to the ID of the last item to fetch the next batch
        lastId = checkouts[checkouts.length - 1].id;
      } else {
        break; // No more checkouts to fetch
      }
    } while (allCheckouts.length % 250 === 0);

    //get abandonedCarts after the plan monthStartDate
    // const referenceDateStr = subscriptionData?.startDate;
    // const referenceDateStr = '2024-11-06T10:28:53+05:30';
    // const referenceDate = new Date(referenceDateStr);

    // const filteredAbandonedCheckouts = allCheckouts.filter(item => {
    //   // Check if 'created_at' exists and parse it as a date
    //   if (item.created_at) {
    //     const createdAtDate = new Date(item.created_at);
    //     // Return only the items where created_at is greater than the reference date
    //     return createdAtDate > referenceDate;
    //   }
    //   return false;
    // });
    // // console.log('filteredAbandonedCheckouts',filteredAbandonedCheckouts);
    // //get recovered carts only for the current month abandoned carts
    // const filteredRecoveredCarts = () => {
    //   return filteredAbandonedCheckouts.filter(item => item.completed_at !== null);
    // };
    // const recoveredCarts = filteredRecoveredCarts();
    // // console.log('recoveredCarts',recoveredCarts);
    

    // getRecoveredCartslist(recoveredCarts);

    // const HasToSend = await checkMatching(session);
    // console.log('HasToSend==============================================', HasToSend);
    

    return json({ success: true, data: allCheckouts });

  } catch (error) {
    console.log("ERROR", error);
    return json({ success: false });
  }


}