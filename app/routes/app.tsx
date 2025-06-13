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
  const [permissions, setPermissions] = React.useState<any>({})
  const { t } = useTranslation()

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
      console.log("ERROR on fetchAppSubscription", error);
    }
    return false;
  }

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
        return {
          manualPlan: permissionResponseData?.data?.manualPlan || null
        };
      }
    } catch (error) {
      console.log("ERROR on fetchPermissions", error);
    }
    return false;
  }

  React.useEffect(() => {
    const checkSubscription = async () => {
      const { subscribed, planName }: any = await fetchAppSubscription();
      if (!subscribed && planName !== "Free") {
        setAnySubscription(false);
      } else {
        setAnySubscription(true);
        // try {
        //   const settingsResponse = await fetch('/api/firestore?collectionName=settings', {
        //     method: 'GET',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //   });
        //   const settingsResponseData = await settingsResponse.json();
        //   if (Object.keys(settingsResponseData.data).length === 0) {
        //     await fetch('/api/saveSettings', {
        //       method: 'POST',
        //       headers: {
        //         'Content-Type': 'application/json',
        //       },
        //       body: JSON.stringify({
        //         durationToSendMessage: "After 10 min",
        //         notificationStatus: true,
        //         followUpMessage: {
        //           header: "Hi [Customer’s Name]",
        //           content: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]"
        //         },
        //         preferredLanguages: ['English'],
        //         durationToSendFollowUpMessage: 'After 24 hours',
        //         selectedLanguage: "en",
        //         isDurationToSendMessageActivated: true,
        //         isSelectedLanguageActivated: false,
        //         isDurationToSendFollowUpMessageActivated: false
        //       }),
        //     });
        //   }
        // } catch (error) {
        //   console.error("Error fetching or saving settings", error);
        // }
      }
      const { manualPlan }: any = await fetchPermissions();
      setPermissions((prev: any) => ({ ...prev, manualPlan }))
      setSelectedPlanName(planName)
    };
    checkSubscription();
  }, []);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">{t("home.title")}</Link>
        {(anySubscription === "loading") ? (<></>) : (!anySubscription) ? (
          <Link to="/app/LetsStart">{t("letsStart.title")}</Link>
        ) : (
          <>
            <Link to="/app/WelcomeConnect">{t("welcome.title")}</Link>
            <Link to="/app/AbandonedList">{t("abandonedList.title")}</Link>
            <Link to="/app/SmartBulk">{t("smartBulk.title")}</Link>
            <Link to="/app/Settings">{t("settings.title")}</Link>
            <Link to="/app/AIChatbot">AI Personal Assistant</Link>
          </>
        )}
      </NavMenu>
      <a href="https://wa.me/972555081948?text=Hi%0AI%20have%20a%20quick%20question%20about%20the%20app" target="_blank" className="whatsapp-link">
        <img src="/images/whatsapp.png" alt="WhatsApp" className="whatsapp-icon" />
      </a>
      <Outlet context={{ anySubscription, setAnySubscription, selectedPlanName, setSelectedPlanName, permissions }} />
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