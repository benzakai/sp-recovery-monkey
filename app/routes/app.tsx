import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import React from "react";

React.useLayoutEffect = React.useEffect

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  // console.log("session.shop)", session.shop);
  // const cancelledSubscription = await billing.cancel({
  //   subscriptionId: "gid://shopify/AppSubscription/29688135931",
  //   isTest: false,
  //   prorate: true,
  // });
  // const getSubscriptionStatus = await fireStoreFetchService("subscriptions", session.shop);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const [isSubscribed, setIsSubscribed] = React.useState<boolean | null>(null);
  const [anySubscription, setAnySubscription] = React.useState<any>("loading");

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
      // console.log("subscribed", subscribed);
      // if (!subscribed) navigate("/app/LetsStart");
      // else {
      //   if (window.location.pathname.includes("/app/")) {
      //     navigate(`/app/${window.location.pathname.split("/app/")[1]}`);
      //   } else {
      //     navigate("/app/WelcomeConnect");
      //   }
      // }
      // if (!subscribed && selectedPlanName !== "Free") navigate("/app/LetsStart")
      // else navigate("/app/WelcomeConnect")
      if (!subscribed && planName !== "Free") setAnySubscription(false)
      else {
        setAnySubscription(true);
        try {
          const settingsResponse = await fetch('/api/firestore?collectionName=settings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const settingsResponseData = await settingsResponse.json();
          // console.log("settingsResponseData", Object.keys(settingsResponseData.data).length === 0);
          if (Object.keys(settingsResponseData.data).length === 0) {
            const saveSettingsRes = await fetch('/api/saveSettings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                durationToSendMessage: "After 10 min",
                notificationStatus: true,
              }),
            });
            const saveSettingsData = await saveSettingsRes.json();
            console.log(saveSettingsData.success ? "Settings saved successfully" : "Error saving settings");
          }
        } catch (error) {
          console.error("Error fetching or saving settings", error);
        }
      }
      setIsSubscribed((!subscribed && planName !== "Free") ? false : true);
    };
    checkSubscription();
  }, [anySubscription]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {/* {isSubscribed === null ?
        <div className='flex justify-center items-center w-full h-full'>
          <Spinner accessibilityLabel="Spinner example" size="large" /></div>
        :
        <> */}
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        {(isSubscribed === null) ? (<></>) : (!isSubscribed) ? (
          <Link to="/app/LetsStart">Let’s Start</Link>
        ) : (
          <>
            <Link to="/app/WelcomeConnect">Welcome</Link>
            <Link to="/app/AbandonedList">Abandoned List</Link>
            {/* <Link to="/app/ConvertPage">Convert</Link> */}
            <Link to="/app/SmartBulk">Smart Bulk</Link>
            {/* <Link to="/app/ConnectPage">Connect Page</Link> */}
            <Link to="/app/Settings">Settings</Link>
          </>
        )}
      </NavMenu>
      {/* </>
      } */}
      <Outlet context={{ anySubscription, setAnySubscription }} />
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
