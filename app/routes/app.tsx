import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import React from "react";
import { useTranslation } from "react-i18next";
// import { trackLCP } from "~/utils/lcpTracker";

React.useLayoutEffect = React.useEffect;

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const [selectedPlanName, setSelectedPlanName] = React.useState<any>(null);
  const [permissions, setPermissions] = React.useState<any>({})
  const { t } = useTranslation()

  async function fetchPermissions(): Promise<any> {
    try {
      const permissionResponse = await fetch('/api/firestore?collectionName=permissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (permissionResponse.ok) {
        const permissionResponseData = await permissionResponse.json();
        // console.log("permissionResponseData==================+>", permissionResponseData.data)
        const manualPlan = permissionResponseData?.data?.manualPlan || null
        setPermissions((prev: any) => ({ ...prev, manualPlan }))
      }
    } catch (error) {
      console.log("ERROR on fetchPermissions", error);
    }
    return false;
  }

  React.useEffect(() => {
    const checkSubscription = async () => {
      try {
        const checkSubResponse = await fetch("/api/active/subscription/get")
        if (!checkSubResponse.ok) {
          throw new Error("error occured while checking subscriptions")
        }
        const subscriptionData = await checkSubResponse.json()
        // console.log("subscriptionData....", subscriptionData)
        if (subscriptionData?.success) {
          const planName = subscriptionData.planName
          setSelectedPlanName(planName)
        } else {
          setSelectedPlanName("Free")
        }
        fetchPermissions()
      } catch (error) {
        console.log("error occured while fetching the subscription plan", error)
      }
    };
    checkSubscription();
  }, []);


  // useEffect(() => {
  //     trackLCP('app.tsx');
  //   }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">{t("home.title")}</Link>
        <Link to="/app/WelcomeConnect">{t("dashboard.title")}</Link>
        <Link to="/app/AbandonedList">{t("abandonedList.title")}</Link>
        <Link to="/app/SmartBulk">{t("smartBulk.title")}</Link>
        <Link to="/app/Settings">{t("settings.title")}</Link>
        <Link to="/app/AIChatbot">{t("aiSettings.title")}</Link>
      </NavMenu>
      <a href="https://wa.me/972555081948?text=Hi%0AI%20have%20a%20quick%20question%20about%20the%20app" target="_blank" className="whatsapp-link">
        <img src="/images/whatsapp.png" alt="WhatsApp" className="whatsapp-icon" />
      </a>
      <div style={{ paddingBottom: "96px" }}>
        <Outlet context={{ selectedPlanName, setSelectedPlanName, permissions }} />
      </div>
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