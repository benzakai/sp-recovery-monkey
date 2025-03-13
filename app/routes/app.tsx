import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import React from "react";

React.useLayoutEffect = React.useEffect;

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const [anySubscription, setAnySubscription] = React.useState<any>("loading");
  const [selectedPlanName, setSelectedPlanName] = React.useState<any>(null);

  async function fetchAppSubscription(): Promise<any> {
    try {
      const response = await fetch("/api/active/subscription/get");
      if (response.ok && response.status === 200) {
        const responseJson = await response.json();
        // console.log("responseJson fetchAppSubscription", responseJson);
        // console.log(`responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE";`,responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE");
        return { subscribed: responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE", planName: responseJson.selectedPlanName };
        // return false
      }
    } catch (error) {
      console.log("ERROR", error);
    }
    return false;
  }

  React.useEffect(() => {
    const checkSubscription = async () => {
      const { subscribed, planName }: any = await fetchAppSubscription();
      setSelectedPlanName(planName)
      if (!subscribed && planName !== "Free") {
        setAnySubscription(false);
      } else {
        setAnySubscription(true);
        try {
          const settingsResponse = await fetch('/api/firestore?collectionName=settings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const settingsResponseData = await settingsResponse.json();
          if (Object.keys(settingsResponseData.data).length === 0) {
            await fetch('/api/saveSettings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                durationToSendMessage: "After 10 min",
                notificationStatus: true,
                followUpMessage: {
                  header: "Hi [Customer’s Name]",
                  content: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]"
                },
                preferredLanguages: ['English']
              }),
            });
          }
        } catch (error) {
          console.error("Error fetching or saving settings", error);
        }
      }
    };
    checkSubscription();
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        {(anySubscription === "loading") ? (<></>) : (!anySubscription) ? (
          <Link to="/app/LetsStart">Let’s Start</Link>
        ) : (
          <>
            <Link to="/app/WelcomeConnect">Welcome</Link>
            <Link to="/app/AbandonedList">Abandoned List</Link>
            <Link to="/app/SmartBulk">Smart Bulk</Link>
            <Link to="/app/Settings">Settings</Link>
          </>
        )}
      </NavMenu>
      <Outlet context={{ anySubscription, setAnySubscription, selectedPlanName, setSelectedPlanName }} />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};