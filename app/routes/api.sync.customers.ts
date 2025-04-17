import { authenticate } from "~/shopify.server";
import { Firestore, Timestamp } from "@google-cloud/firestore";
import currencySymbols from "~/utils/currencySymbols";
const firestoreDatabase = new Firestore();

export const action = async ({ request }: any) => {
    const { session, admin } = await authenticate.admin(request);
    const { dateRange } = await request.json();
    const { since, until } = dateRange;
    // console.log("dateRange", dateRange);
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
                        ${endCursor
                            ? `customers(first: 2, after: "${endCursor}", sortKey: CREATED_AT, reverse: true, query: "phone:* AND createdAt:>=${since} AND createdAt:<=${until}")`
                            : `customers(first: 2, sortKey: CREATED_AT, reverse: true, query: "phone:* AND createdAt:>=${since} AND createdAt:<=${until}")`
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
            // console.log("initialCustomersData", initialCustomersData);
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

            hasNextPage = responseData?.data?.customers?.pageInfo?.hasNextPage;
            endCursor = responseData?.data?.customers?.pageInfo?.endCursor;
        }

        // console.log("customersFound", customersFound.length, customersFound);

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

        return {
            success: true,
            message: "Customers synced successfully"
        }

    } catch (error) {
        console.log("error occured on sync customers", error);
    }
}