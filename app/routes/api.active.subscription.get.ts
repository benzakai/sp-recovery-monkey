import { LoaderFunctionArgs } from "@remix-run/node";
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
    // console.log(`data.data.currentAppInstallation.activeSubscriptions============>`, data.data.currentAppInstallation);
    // to check if user is on free plan
    const doc = await fireStoreFetchService("subscriptions", session.shop);
    // console.log("doc", doc);
    const selectedPlanName = (doc?.plan === "Free" && doc?.status === "ACTIVE") ? "Free" : null

    if (data.data.currentAppInstallation.activeSubscriptions.length > 0) return {
      success: true,
      activeSubscriptions: data.data.currentAppInstallation.activeSubscriptions,
      selectedPlanName
    }

    return { success: false, selectedPlanName };
  } catch (error) {
    console.log("ERROR on active.subscription.get", error);
    return { success: false };
  }
}