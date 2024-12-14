import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
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
    // console.log(`data.data.currentAppInstallation.activeSubscriptions`, data.data.currentAppInstallation);

    if (data.data.currentAppInstallation.activeSubscriptions.length > 0) return {
      success: true,
      activeSubscriptions: data.data.currentAppInstallation.activeSubscriptions
    }

    return { success: false };
  } catch (error) {
    console.log("ERROR on active.subscription.get", error);
    return { success: false };
  }
}