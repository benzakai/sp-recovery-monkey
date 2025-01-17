import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getAppInstalledDate, getSubscriptionsData } from "~/services/sendDataFromWebhooks";
import axios from "axios";
import fireStoreFetchService from "~/services/fireStoreFetchService";

// const formatDateInCustomFormat = (date: Date): string => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   const hours = String(date.getHours()).padStart(2, '0');
//   const minutes = String(date.getMinutes()).padStart(2, '0');
//   const seconds = String(date.getSeconds()).padStart(2, '0');

//   const timezoneOffset = -date.getTimezoneOffset();
//   const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
//   const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
//   const offsetSign = timezoneOffset >= 0 ? '+' : '-';

//   const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;

//   return formattedDate;
// }

const before1Year = () => {
  const endDate = new Date().toISOString();
  const today = new Date();
  today.setMonth(today.getMonth() - 12);
  const startDate = today.toISOString();
  return { startDate, endDate }
}


// function convertFirestoreTimestampToISO(timestamp: any) {
//   const milliseconds = timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000;
//   const date = new Date(milliseconds);

//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   const hours = String(date.getHours()).padStart(2, '0');
//   const minutes = String(date.getMinutes()).padStart(2, '0');
//   const seconds = String(date.getSeconds()).padStart(2, '0');

//   const timezoneOffset = -date.getTimezoneOffset();
//   const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
//   const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
//   const offsetSign = timezoneOffset >= 0 ? '+' : '-';

//   return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
// }

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

export async function action({ request }: ActionFunctionArgs) {
  const { appSubscriptionCreated, pageName, planType } = JSON.parse(await request.text());
  console.log("payload", appSubscriptionCreated, pageName);
  const { admin, session } = await authenticate.admin(request);
  // const today = new Date();
  // const daysBefore30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  // const last30Days = formatDateInCustomFormat(daysBefore30);
  const { startDate, endDate } = before1Year()
  let allCheckouts = [];
  let hasNextPage = null;
  let endCursor = null;

  const appInstalledDateData = await fireStoreFetchService("AppInstalledDate", session.shop);
  const appInstalledDate = new Date(appInstalledDateData.appInstalledDate._seconds * 1000 + appInstalledDateData.appInstalledDate._nanoseconds / 1000000);
  // console.log("appInstalledDate", appInstalledDate);
  // console.log("appSubscriptionCreated", appSubscriptionCreated);
  // console.log("planType", planType);
  // console.log("pageName", pageName);
  const asPerPlanDate = planType === "Free" ? appInstalledDate : appSubscriptionCreated
  // console.log("asPerPlanDate", asPerPlanDate);

  try {


    while (hasNextPage != false) {

      const response: any = await axios({
        url: `https://${session.shop}/admin/api/2024-10/graphql.json`,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken,
        },
        data: {
          query: `query {
            ${hasNextPage != null ?
              `abandonedCheckouts(first: 50, sortKey: CREATED_AT, reverse: true, after: "${endCursor}" ${pageName === "WelcomeConnect" ? `, query: "created_at:>=${asPerPlanDate}"` : `, query: "created_at:>=${startDate} AND created_at:<=${endDate}"`}) {` :
              `abandonedCheckouts(first: 50, sortKey: CREATED_AT, reverse: true ${pageName === "WelcomeConnect" ? `, query: "created_at:>=${asPerPlanDate}"` : `, query: "created_at:>=${startDate} AND created_at:<=${endDate}" `}) {`
            }
                edges {
                  node {
                    id
                    createdAt
                    updatedAt
                    completedAt
                    totalPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    customer {
                      firstName
                      lastName
                      email
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                  hasPreviousPage
                }
            }
            }`
        }
      });
      // console.log("response of abandoned-checkouts", response.data.data);
      allCheckouts.push(...response.data.data.abandonedCheckouts.edges);
      hasNextPage = response.data.data.abandonedCheckouts.pageInfo.hasNextPage;
      endCursor = response.data.data.abandonedCheckouts.pageInfo.endCursor;
    }

    // const appInstalledDate = await getAppInstalledDate(session);
    const getShopCurrency = await admin.graphql(`query { shop { currencyCode }}`);

    const getShopCurrencyJson = await getShopCurrency.json();

    // console.log("allCheckouts", allCheckouts, "appSubscriptionCreated", appSubscriptionCreated);

    const shopCurrency = currencySymbols[getShopCurrencyJson.data.shop.currencyCode];
    if (!allCheckouts.length) return {
      success: true,
      allCarts: [],
      abandonedCarts: [],
      abandonedCartsSum: '0.00',
      recoveredCarts: [],
      recoveredCartsSum: '0.00',
      acrRate: 'NaN',
      shopCurrency
    }
    // console.log(`allCheckouts.filter((item: any) => new Date(item.node.createdAt).getTime()`, allCheckouts.filter((item: any) => new Date(item.node.createdAt).getTime()))
    // console.log(`new Date(appSubscriptionCreated).getTime()`, new Date(appSubscriptionCreated).getTime())

    // const getAbandonedCartsSinceAppInstall = allCheckouts.filter((item: any) => new Date(item.node.createdAt).getTime() >= new Date(appSubscriptionCreated).getTime());
    // console.log("getAbandonedCartsSinceAppInstall", getAbandonedCartsSinceAppInstall);


    // const getAbandonedCartsCount = getAbandonedCartsSinceAppInstall.filter((item: any) => item.node.completedAt == null).length;

    const getAllCartsCount = allCheckouts.length;

    const getAbandonedCartsRecoveredCount = allCheckouts.filter((item: any) => item.node.completedAt != null).length;

    console.log("getAbandonedCartsRecoveredCount", getAbandonedCartsRecoveredCount, "getAllCartsCount", getAllCartsCount);

    const calculateACRRate = ((getAbandonedCartsRecoveredCount / getAllCartsCount) * 100).toFixed(2);

    const getAllAbandonedCarts = allCheckouts.filter((item: any) => item.node.completedAt == null);

    let getAllAbandonedCartsSum: number = 0;
    for (let i = 0; i < getAllAbandonedCarts.length; i++) getAllAbandonedCartsSum += parseFloat(getAllAbandonedCarts[i].node.totalPriceSet.shopMoney.amount);

    const getAllRecoveredCarts = allCheckouts.filter((item: any) => item.node.completedAt != null);

    let getAllRecoveredCartsSum: number = 0;
    for (let i = 0; i < getAllRecoveredCarts.length; i++) getAllRecoveredCartsSum += parseFloat(getAllRecoveredCarts[i].node.totalPriceSet.shopMoney.amount);

    return {
      success: true,
      allCarts: allCheckouts,
      abandonedCarts: getAllAbandonedCarts,
      abandonedCartsSum: getAllAbandonedCartsSum.toFixed(2),
      recoveredCarts: getAllRecoveredCarts,
      recoveredCartsSum: getAllRecoveredCartsSum.toFixed(2),
      acrRate: calculateACRRate,
      shopCurrency
    };

  } catch (error) {
    console.log("ERROR on abandoned-checkouts.get", error);
    return json({ success: false });
  }
}