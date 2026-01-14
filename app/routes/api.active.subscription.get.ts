import { LoaderFunctionArgs } from "@remix-run/node";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  try {
    const response = await admin.graphql(
      `#graphql
            query GetRecurringApplicationCharges {
              currentAppInstallation {
                activeSubscriptions {
                  id
                  createdAt
                  currentPeriodEnd
                  name
                  test
                  trialDays
                  status
                  lineItems {
                    id
                    plan {
                      pricingDetails {
                        __typename
                      }
                    }
                  }
                }
              }
            }`,
    );

    const data = await response.json();

    if (data?.errors) {
      throw new Error("shopify GraphQL error when retrieving active plan details");
    }

    // console.log(`data.data.currentAppInstallation.activeSubscriptions============>`, data.data.currentAppInstallation);
    // to check if user is on free plan
    // console.log("doc", doc);
    const subscriptions = data.data.currentAppInstallation.activeSubscriptions || [];
    const activeSub = subscriptions.find((sub: any) => sub.status === "ACTIVE");

    if (activeSub) {
      return new Response(JSON.stringify({
        success: true,
        planName: activeSub.name
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    }

    const doc = await fireStoreFetchService("subscriptions", session.shop);
    // console.log("doc=======>", doc);

    if (!doc || doc.plan !== "Free") {
      await fireStoreCreateService(
        "subscriptions",
        session.shop,
        {
          storeId: session.shop,
          plan: "Free",
          status: "ACTIVE",
          startDate: new Date().toISOString(),
          endDate: ""
        },
        { merge: true }
      );
    }

    return new Response(JSON.stringify({
      success: true,
      planName: "Free"
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.log("ERROR on active.subscription.get", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}