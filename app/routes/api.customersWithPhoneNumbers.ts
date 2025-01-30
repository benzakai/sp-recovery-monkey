import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

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
    const { initialRender, endCursor, startCursor, PageSize, selectedDateValues, queryValue, selectedFilter, } = JSON.parse(await request.text());
    const { admin, session } = await authenticate.admin(request);
    // console.log("selectedDateValues", selectedDateValues);
    // console.log("selectedFilter, PageSize", selectedFilter, PageSize);
    // created_at:>=${selectedDateValues?.since} AND created_at:<=${selectedDateValues?.until}${queryValue ? `AND ${queryValue}` : ''} AND
    const pagination = `${initialRender ? `first: ${PageSize},` : ''}${endCursor ? `first:${PageSize}, after: "${endCursor}",` : ''}${startCursor ? `last:${PageSize}, before: "${startCursor}",` : ''}`
    const dateRangeQuery = `AND created_at:>=${selectedDateValues?.since} AND created_at:<=${selectedDateValues?.until}`
    const customerSearchQuery = `${queryValue ? `AND ${queryValue}` : ''}`
    const updatedAtFilter = selectedFilter.includes("lastUpdate") ? `updated_at:<=${new Date().toISOString().split('T')[0]}` : ''

    let sortValue = "";
    if (selectedFilter.includes("lastUpdate")) {
        sortValue = `RELEVANCE`
    }
    // else if (selectedFilter.includes("revenue")) {
    //     sortValue = `TOTAL_PRICE`
    // }

    let reverseValue;
    if (selectedFilter.includes("revenue asc")) {
        reverseValue = true
    } else if (selectedFilter.includes("revenue desc")) {
        reverseValue = false
    } else if (selectedFilter.includes("lastUpdate asc")) {
        reverseValue = false
    } else {
        reverseValue = true
    }
    // console.log("sortValue:  ", sortValue, "    ", "reverseValue:  ", reverseValue);
    // console.log("updatedAtFilter", updatedAtFilter);
    // console.log("customerSearchQuery", customerSearchQuery);
    // console.log("dateRangeQuery", dateRangeQuery);
    try {
        const response: any = await fetch(`https://${session.shop}/admin/api/2024-10/graphql.json`, {
            method: "POST",
            ...(session.accessToken ? {
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": session.accessToken,
                }
            } : {}),
            body: JSON.stringify({
                query: `query {
                    customers(${pagination}, reverse: ${reverseValue}  query: "${updatedAtFilter} ${dateRangeQuery}  ${customerSearchQuery} AND phone:*") 
                    {
                        nodes {
                            id
                            firstName
                            lastName
                            email
                            phone
                            createdAt
                            updatedAt
                            numberOfOrders
                            emailMarketingConsent {
                                consentUpdatedAt
                                marketingState
                            }
                        }    
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            endCursor
                            startCursor
                        }
                    }
                }`,
            }),
        });
        const responseData = await response.json();

        let Nextdate = new Date(selectedDateValues?.until);
        Nextdate.setDate(Nextdate.getDate() + 1);
        // console.log("Nextdate.toISOString().split('T')[0]", Nextdate.toISOString().split('T')[0]);

        const countResponse: any = await fetch(`https://${session.shop}/admin/api/2024-10/graphql.json`, {
            method: "POST",
            ...(session.accessToken ? {
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": session.accessToken,
                }
            } : {}),
            body: JSON.stringify({
                query: `query CustomerCount { 
                            customersCount (${selectedDateValues?.since ? `query: "${updatedAtFilter} AND created_at:>=${selectedDateValues?.since} AND created_at:<=${Nextdate.toISOString().split('T')[0]} ${customerSearchQuery} AND phone:*"` : `query:"phone:*"`}) {
                                count
                            } 
                        }`,
            }),
        });
        const countResponseData = await countResponse.json();

        const getShopCurrency = await admin.graphql(`query { shop { currencyCode }}`);
        const getShopCurrencyJson = await getShopCurrency.json();
        // const getAllCustomersCarts = responseData?.data?.customers?.nodes
        // let getAllCustomersCartsSum: number = 0;
        // for (let i = 0; i < getAllCustomersCarts?.length; i++) getAllCustomersCartsSum += parseFloat(getAllCustomersCarts[i].totalPriceSet.shopMoney.amount);
        const shopCurrency = currencySymbols[getShopCurrencyJson.data.shop.currencyCode];

        // console.log("responseData?.data?.customers?.nodes?.length", responseData?.data?.customers?.nodes?.length);

        return json({
            success: true,
            customers: responseData?.data?.customers?.nodes,
            totalCount: countResponseData?.data?.customersCount?.count,
            shopCurrency,
            abandonedCartsSum: 2,
            pageInfo: responseData?.data?.customers?.pageInfo
        });
    } catch (error) {
        console.log("Error fetching customersWithPhoneNumbers:", error);
        return json({ success: false });
    }
}
