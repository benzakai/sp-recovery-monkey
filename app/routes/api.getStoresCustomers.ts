import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Firestore, Timestamp } from "@google-cloud/firestore";
import currencySymbols from "~/utils/currencySymbols";
const firestoreDatabase = new Firestore();

const fetchAndStoreInitialCustomersData: any = async ({ session }: any) => {
    try {
        let customersFound = [];
        let hasNextPage = true;
        let endCursor = null;

        while (hasNextPage) {
            const response: any = await fetch(`https://${session.shop}/admin/api/2024-10/graphql.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": session.accessToken,
                },
                body: JSON.stringify({
                    query: `query {
                        ${endCursor ? `customers(first: 1, after: "${endCursor}", sortKey: CREATED_AT, reverse: true, query: "phone:*")` :
                            `customers(first: 1, sortKey: CREATED_AT, reverse: true, query: "phone:*")`
                        } 
                        {
                            nodes {
                                id
                                firstName
                                lastName
                                email
                                phone
                                amountSpent{
                                    amount
                                    currencyCode
                                }
                                createdAt
                                updatedAt
                                numberOfOrders
                                emailMarketingConsent {
                                    consentUpdatedAt
                                    marketingState
                                }
                                addresses {
                                    id
                                    firstName
                                    lastName
                                    phone
                                }
                                defaultAddress {
                                    id
                                    firstName
                                    lastName
                                    phone
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

            const initialCustomersData = responseData?.data?.customers?.nodes || [];
            // console.log("responseData?.data", responseData?.data);
            const initialCustomersDataWithCurrency = initialCustomersData.map((customer: any) => {
                const { amountSpent, defaultAddress, addresses } = customer;
                const currencyCode = amountSpent?.currencyCode || 'USD';
                const currencySymbol = currencySymbols[currencyCode] || '$';

                const firstName =
                    customer.firstName ||
                    defaultAddress?.firstName ||
                    addresses?.[0]?.firstName ||
                    '';

                const lastName =
                    customer.lastName ||
                    defaultAddress?.lastName ||
                    addresses?.[0]?.lastName ||
                    '';

                const phone =
                    customer.phone ||
                    defaultAddress?.phone ||
                    addresses.find((d: any) => d?.phone)?.phone ||
                    '';
                if (customer.emailMarketingConsent?.marketingState === "SUBSCRIBED") {
                    return {
                        idNumber: Number(customer.id.split('/').pop()),
                        id: customer.id,
                        name: `${firstName} ${lastName}`,
                        email: customer.email,
                        phone,
                        numberOfOrders: customer.numberOfOrders,
                        amountSpent: parseFloat(customer.amountSpent?.amount) || 0,
                        currencySymbol,
                        currencyCode,
                        emailMarketingConsentUpdatedAt: customer.emailMarketingConsent?.consentUpdatedAt
                            ? Timestamp.fromDate(new Date(customer.emailMarketingConsent?.consentUpdatedAt))
                            : null,
                        emailMarketingConsentState: customer.emailMarketingConsent?.marketingState || null,
                        createdAt: Timestamp.fromDate(new Date(customer.createdAt)),
                        updatedAt: Timestamp.fromDate(new Date(customer.updatedAt)),
                    };
                } else {
                    return null
                }
            }).filter((customer: any) => customer !== null);

            customersFound.push(...initialCustomersDataWithCurrency);

            if (customersFound.length < 50) {
                hasNextPage = responseData?.data?.customers?.pageInfo?.hasNextPage;
                endCursor = responseData?.data?.customers?.pageInfo?.endCursor;
            } else {
                hasNextPage = false;
                endCursor = null;
            }
        }

        // console.log("customersFound", customersFound.length, customersFound);

        // console.log("initialCustomersDataWithCurrency", initialCustomersDataWithCurrency);
        const batch = firestoreDatabase.batch();

        // adding something in parent doc
        const storeCustomerRef = firestoreDatabase.collection('storeCustomers').doc(session.shop);
        batch.set(storeCustomerRef, {
            syncedCustomersAt: Timestamp.now()
        }, { merge: true });

        // adding customer documents to subcollection
        customersFound.forEach((customer: any) => {
            const customerRef = storeCustomerRef.collection('customers').doc(customer.id.split('/').pop());
            batch.set(customerRef, customer);
        });

        await batch.commit();
        // console.log("Initial customers data fetched and stored in Firestore.", initialCustomersDataWithCurrency);
        return;
    } catch (error) {
        console.log("Error fetching initial customers data:", error);
        return [];
    }
}

const getCustomersData: any = async ({
    session,
    filterField,
    filterValue,
    search,
    limit,
    startAfter,
    prevCursor,
    paginationDirection,
    nextNameCursor,
    prevNameCursor
}: any) => {
    let query: any = firestoreDatabase
        .collection('storeCustomers')
        .doc(session.shop)
        .collection('customers')
        .where('emailMarketingConsentState', '==', 'SUBSCRIBED');

    if (!search) {
        // console.log("inside if !search", search);
        query = query.orderBy('idNumber');
    }

    console.log(`all data ====================>>>>>`, {
        filterField,
        filterValue,
        search,
        limit,
        startAfter,
        prevCursor,
        paginationDirection,
        nextNameCursor,
        prevNameCursor
    });

    // a count query to get the total number of documents but not using this becuase it ca n increae reads count.
    // const queryCountGet = await query.count().get();
    // console.log("queryCountGet.data().count", queryCountGet.data().count);

    // applying filteringd if selected.
    if (filterField && String(filterValue)) {
        // console.log("inside a filtering", filterField, "filterValue", filterValue);
        if (filterValue?.since) {
            // console.log("inside a filterValue?.since", filterField, "filterValue", filterValue);
            const sinceDate = new Date(filterValue.since);
            sinceDate.setHours(0, 0, 0, 0);
            query = query.where(filterField, '>=', Timestamp.fromDate(sinceDate));
            const untilDate = new Date(filterValue.until);
            untilDate.setHours(23, 59, 59, 999);
            query = query.where(filterField, '<=', Timestamp.fromDate(untilDate));
        }
        // query = query.where(filterField, '==', filterValue);
    }

    const increasedLimit = parseInt(limit) + 1;

    if (search) {
        // console.log("inside search", search);
        query = query.where('name', '>=', search)
            .where('name', '<=', search + '\uf8ff')
            .orderBy('name')
    }
    // else {
    // if (sortField && sortValue && isSorting) {
    //     console.log("inside if sortField", sortField, "sortValue", sortValue, " paginationDirection", paginationDirection);

    //     query = query.orderBy(sortField, sortValue.toLowerCase() === 'asc' ? 'asc' : 'desc');
    // } else {
    //     console.log("inside else sortField", sortField, "sortValue", sortValue);
    //     query = query.orderBy('idNumber');
    // }
    if (paginationDirection === 'next') {
        if (startAfter || nextNameCursor) {
            // console.log("inside paginationDirection === 'next'", startAfter, nextNameCursor);
            if (search) {
                query = query.startAfter(nextNameCursor);
            } else {
                query = query.startAfter(startAfter);
            }
        }
        query = query.limit(increasedLimit);
    } else if (paginationDirection === 'prev') {
        if (prevCursor || prevNameCursor) {
            // console.log("inside paginationDirection === 'prev'", prevCursor, prevNameCursor);
            if (search) {
                query = query.endBefore(prevNameCursor);
            } else {
                query = query.endBefore(prevCursor);
            }
        }
        query = query.limitToLast(increasedLimit);
    } else {
        query = query.limit(increasedLimit);
    }


    // executing a the query.
    const snapshot = await query.get();
    const docs = snapshot.docs;
    // console.log("docs length", docs.length, "docs", docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));

    let hasNextPage = false;
    let hasPreviousPage = false;

    // checking if page exist based on extra fetched document
    if (paginationDirection === 'next' || !paginationDirection) {
        if (docs.length === increasedLimit) {
            hasNextPage = true;
            docs.pop(); // removing the extra document used for checking next page
        }
        // If provided a 'startAfter', then not on the first page
        hasPreviousPage = Boolean(startAfter);
    } else if (paginationDirection === 'prev') {
        if (docs.length === increasedLimit) {
            hasPreviousPage = true;
            docs.shift(); // removiing the extra document used for checking previous page
        }
        // On previous click if a 'prevCursor' is provided, then a next page exists in that direction
        hasNextPage = Boolean(prevCursor);
    }


    const customers = docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const firstDoc = docs[0];
    const lastDoc = docs[docs.length - 1];
    // console.log("firstDoc", firstDoc?.data(), "lastDoc", lastDoc?.data());

    const nextCursor = lastDoc ? lastDoc.get("idNumber") : null;
    const prevCursorOut = firstDoc ? firstDoc.get("idNumber") : null;
    const nextNameCurs = lastDoc ? lastDoc.get("name") : null;
    const prevNameCursOut = firstDoc ? firstDoc.get("name") : null;


    return {
        customers,
        totalCount: 0,
        options: query._queryOptions,
        pageInfo: {
            hasNextPage,
            hasPreviousPage,
            nextCursor,
            prevCursor: prevCursorOut,
            nextNameCursor: nextNameCurs,
            prevNameCursor: prevNameCursOut,
        }
    }
}

const hasAnyOneCustomer: any = async ({ session }: any) => {
    const query = firestoreDatabase
        .collection('storeCustomers')
        .doc(session.shop)
        .collection('customers')
        .limit(1);
    const snapshot = await query.get();
    const docs = snapshot.docs;
    // console.log("docs length", docs.length, "docs", docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    return docs.length > 0;
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const {
        filterField,
        filterValue,
        search = '',
        limit = 5,
        startAfter = '',
        prevCursor = '',
        paginationDirection = 'next',
        nextNameCursor,
        prevNameCursor
    }: any = JSON.parse(await request.text());

    try {
        let data;
        const hasData = await hasAnyOneCustomer({ session });
        // console.log("customers================+>>>>> before processing", "hasData:", hasData);
        if (!hasData) {
            await fetchAndStoreInitialCustomersData({ session });
            data = await getCustomersData({
                session,
                filterField,
                filterValue,
                search,
                limit,
                startAfter,
                prevCursor,
                paginationDirection,
                nextNameCursor,
                prevNameCursor
            })
            // console.log("customers================+>>>>> inside processing");
        } else {
            data = await getCustomersData({
                session,
                filterField,
                filterValue,
                search,
                limit,
                startAfter,
                prevCursor,
                paginationDirection,
                nextNameCursor,
                prevNameCursor
            })
        }
        console.log("customers================+>>>>> after or without processing", "customers:", data?.customers?.length, "   pageInfo:", data?.pageInfo);
        return json({
            success: true,
            ...data
        });
    } catch (error) {
        console.log("Error fetching customersWithPhoneNumbers:", error);
        return json({ success: false });
    }
}
