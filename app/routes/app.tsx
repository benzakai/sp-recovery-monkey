import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import * as React from "react";
import { Frame, Loading } from '@shopify/polaris';
import fireStoreFetchService from "~/services/fireStoreFetchService";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  // const getSubscriptionStatus = await fireStoreFetchService("subscriptions", session.shop);
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
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
      if (!subscribed) navigate("/app/LetsStart");
      else {
        if (window.location.pathname.includes("/app/")) {
          navigate(`/app/${window.location.pathname.split("/app/")[1]}`);
        } else {
          navigate("/app/WelcomeConnect");
        }
      }
      setIsSubscribed(subscribed);
    };
    checkSubscription();
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {isSubscribed === null ?
        <Frame>
          <Loading />
        </Frame> :
        <>
          {!isSubscribed ? (
            <NavMenu>
              <Link to="/app/LetsStart">Let’s Start</Link>
            </NavMenu>
          ) : (
            <NavMenu>
              <Link to="/app/WelcomeConnect">Welcome</Link>
              <Link to="/app/AbandonedList">Abandoned List</Link>
              <Link to="/app/ConvertPage">Convert</Link>
              <Link to="/app/ConnectPage">Connect Page</Link>
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
