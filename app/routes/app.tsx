import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import * as React from "react";
import fireStoreFetchService from "~/services/fireStoreFetchService";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const getSubscriptionStatus = await fireStoreFetchService("subscriptions", session.shop);
  let isSubscribed;

  if (getSubscriptionStatus == undefined || getSubscriptionStatus?.status != "ACTIVE") isSubscribed = false;
  else isSubscribed = true;

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "", isSubscribed });
};

export default function App() {
  const { apiKey, isSubscribed } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isSubscribed) navigate("/app/LetsStart");
    else navigate("/app/WelcomeConnect");
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {
        !isSubscribed ? (
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
        )
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
