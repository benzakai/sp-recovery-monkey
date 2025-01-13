import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import React from "react";
import { Spinner } from '@shopify/polaris';
import fireStoreFetchService from "~/services/fireStoreFetchService";

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
  // to check if user is on free plan
  const doc = await fireStoreFetchService("subscriptions", session.shop);
  // console.log("doc", doc);
  const selectedPlanName = (doc?.plan === "Free" && doc?.status === "ACTIVE") ? "Free" : null

  // const getSubscriptionStatus = await fireStoreFetchService("subscriptions", session.shop);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "", selectedPlanName });
};

export default function App() {
  const { apiKey, selectedPlanName } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = React.useState<boolean | null>(null);

  async function fetchAppSubscription(): Promise<boolean> {
    try {
      const response = await fetch("/api/active/subscription/get");
      if (response.ok && response.status === 200) {
        const responseJson = await response.json();
        // console.log("responseJson fetchAppSubscription", responseJson);

        // console.log(`responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE";`,responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE");
        return responseJson?.activeSubscriptions?.[0]?.status === "ACTIVE";
        // return false
      }
    } catch (error) {
      console.log("ERROR", error);
    }
    return false;
  }

  React.useEffect(() => {
    const checkSubscription = async () => {
      const subscribed: boolean = await fetchAppSubscription();
      // console.log("subscribed", subscribed);
      // if (!subscribed) navigate("/app/LetsStart");
      // else {
      //   if (window.location.pathname.includes("/app/")) {
      //     navigate(`/app/${window.location.pathname.split("/app/")[1]}`);
      //   } else {
      //     navigate("/app/WelcomeConnect");
      //   }
      // }
      if (!subscribed && selectedPlanName !== "Free") navigate("/app/LetsStart");
      else navigate("/app/WelcomeConnect");
      // console.log(`!subscribed && selectedPlanName !== "Free"`, !subscribed && selectedPlanName !== "Free")
      // console.log("subscribed", subscribed);
      // console.log("selectedPlanName", selectedPlanName);
      setIsSubscribed(subscribed);
    };
    checkSubscription();
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {isSubscribed === null ?
        <div className='flex justify-center items-center w-full h-full'>
          <Spinner accessibilityLabel="Spinner example" size="large" /></div>
        :
        <>
          {(!isSubscribed && selectedPlanName !== "Free") ? (
            <NavMenu>
              <Link to="/app/LetsStart">Let’s Start</Link>
            </NavMenu>
          ) : (
            <NavMenu>
              <Link to="/app/WelcomeConnect">Welcome</Link>
              <Link to="/app/AbandonedList">Abandoned List</Link>
              {/* <Link to="/app/ConvertPage">Convert</Link> */}
              <Link to="/app/SmartBulk">Smart Bulk</Link>
              {/* <Link to="/app/ConnectPage">Connect Page</Link> */}
              <Link to="/app/Settings">Settings</Link>
            </NavMenu>
          )}
        </>
      }
      <Outlet />
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
