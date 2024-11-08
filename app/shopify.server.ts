import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  BillingInterval,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import prisma from "./db.server";
import cron from "node-cron";
import { sendDataFromWebhooks } from "./services/sendDataFromWebhooks";
import { setAppInstalledDate } from "./services/sendDataFromWebhooks";

export const MONTHLY_PLAN = 'Monthly subscription';
export const STARTER_PLAN = 'Starter';
export const PRO_PLAN = 'Pro';
export const ADVANCE_PLAN = 'Advance';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    CHECKOUTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    CHECKOUTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
      console.log("AFTER REGISTER WEBHOOKS");
      const date = new Date();
      const timestamp = date.getTime();
      const newDate = new Date(timestamp);
      const data = {
        appInstalledDate: newDate,
        recoveredcarts: 0
      }
      await setAppInstalledDate(session,data);
    },
  },
  billing: {
    [STARTER_PLAN]: {
      amount: 19,
      trialDays: 7,
      isTest: true,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    [PRO_PLAN]: {
      amount: 49,
      trialDays: 7,
      isTest: true,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    [ADVANCE_PLAN]: {
      amount: 99,
      trialDays: 7,
      isTest: true,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
  },
  restResources,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

cron.schedule("*/10 * * * * *", async () => {
  console.log("Cron Job is Active every 10 seconds");
  await sendDataFromWebhooks();
});

export default shopify;
export const apiVersion = ApiVersion.July24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
