import prisma from "~/db.server";

export const action = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json();
    const { customerId, shop, checkout_token } = body;

    if (!shop) {
      return new Response("Missing 'shop' parameter", { status: 400 });
    }
    if (!customerId && !checkout_token) {
      return new Response("Missing 'customerId' or 'checkout_token' parameter", { status: 400 });
    }

    const shopData = await prisma.session.findFirst({ where: { shop } });
    if (!shopData || !shopData.accessToken || !shopData.shop) {
      return new Response("Shop not found or missing access token", { status: 404 });
    }

    const allOrders: any[] = [];
    let hasNextPage = true;
    let afterCursor: string | null = null;

    const now = new Date();
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);
    const isoNow = now.toISOString();
    const isoPast = thirtyHoursAgo.toISOString();

    const timeFilter = `created_at:>='${isoPast}' AND created_at:<='${isoNow}'`;
    const filterValueBase = checkout_token
      ? `checkout_token:${checkout_token}`
      : `customer_id:${customerId}`;

    const query = `
      query getOrders($after: String, $filter: String!) {
        orders(first: 250, after: $after, sortKey: CREATED_AT, reverse: false, query: $filter) {
          nodes {
            id
            name
            phone
            customer {
              defaultPhoneNumber { phoneNumber }
              displayName
              firstName
              lastName
            }
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            email
            shippingAddress {
              address1 city provinceCode zip
            }
            lineItems(first: 250) {
              edges {
                node {
                  name quantity sku variant { id title }
                }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    while (hasNextPage) {
      const filterValue = `${timeFilter} ${filterValueBase}`;
      const variables: any = { after: afterCursor, filter: filterValue };

      const response = await fetch(
        `https://${shopData.shop}/admin/api/2025-07/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": shopData.accessToken,
          },
          body: JSON.stringify({ query, variables }),
        }
      );

      const json = await response.json();

      if (!response.ok || json.errors) {
        console.error("GraphQL error:", json.errors || json);
        return new Response("Failed to fetch Shopify orders", { status: response.status });
      }

      const orders = json.data.orders;
      allOrders.push(...orders.nodes);
      hasNextPage = orders.pageInfo.hasNextPage;
      afterCursor = orders.pageInfo.endCursor;
    }

    return new Response(
      JSON.stringify({ orders: allOrders, message: allOrders.length ? "exist" : "doesn't exist" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("error occured on getCustomerOrder:", error);
    return new Response("error occured on getCustomerOrder", { status: 500 });
  }
};
