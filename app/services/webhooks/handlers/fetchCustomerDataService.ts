import prisma from "~/db.server";

export async function fetchCustomerDataService({ shop, email }: { shop: string, email: string }) {
    try {
        if (!shop || !email) {
            throw new Error("Shop and email are required parameters");
        }
        const shopData = await prisma.session.findFirst({ where: { shop } });
        if (!shopData) {
            return { success: false, error: "Session not found for the shop" };
        }

        const response = await fetch(`https://${shop}/admin/api/2025-07/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": shopData.accessToken || ""
            },
            body: JSON.stringify({
                query: `
                    query CustomerList{
                        customers(first: 2, query: "email:${email}") {
                            nodes {
                                id
                                firstName
                                lastName
                                defaultEmailAddress {
                                    emailAddress
                                }
                                defaultPhoneNumber {
                                    phoneNumber
                                }
                                createdAt
                                updatedAt
                            }
                        }
                    }
                `
            })
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch customer data: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data || !data.data || !data.data.customers || data.data.customers.nodes.length === 0) {
            return { success: false, error: "Customer not found" };
        }
        const customer = data.data.customers.nodes[0];
        if (!customer.id) {
            return { success: false, error: "Customer ID not found" };
        }
        return {
            success: true,
            customer
        };
    } catch (error) {
        // console.log("error occured in fetchCustomerDataService", error);
        return {
            success: false, error: error || "An error occurred while fetching customer"
        }
    }
}