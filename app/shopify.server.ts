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
import { getShopDetails, setAppInstalledDate } from "./services/sendDataFromWebhooks";
import { getAppInstalledDate } from "./services/sendDataFromWebhooks";
import { sendDataAppInstallTopicPubSub } from "./services/sendDataFromWebhooks";
import * as dotenv from "dotenv";
import fireStoreDeleteService from "./services/fireStoreDeleteService";
dotenv.config();

export const STARTER_PLAN = 'Starter';
export const PRO_PLAN = 'Pro';
export const ADVANCE_PLAN = 'Advance';
export const STARTER_PLAN_YEARLY = 'Starter Yearly';
export const PRO_PLAN_YEARLY = 'Pro Yearly';
export const ADVANCE_PLAN_YEARLY = 'Advance Yearly';

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
    CUSTOMERS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
    CUSTOMERS_DELETE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: '/webhooks',
    },
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
    ORDERS_PAID: {
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
    afterAuth: async ({ admin, session }) => {
      await shopify.registerWebhooks({ session });
      console.log("AFTER REGISTER WEBHOOKS");
      const isAppInstalled = await getAppInstalledDate(session);
      if (!isAppInstalled) {
        const date = new Date();
        const timestamp = date.getTime();
        const newDate = new Date(timestamp);
        const data: any = {
          appInstalledDate: newDate,
          storeId: session.shop
        }

        const shopDetails = await getShopDetails(admin);

        if (shopDetails?.success == true) {
          data["phone"] = shopDetails?.phone;
          data["email"] = shopDetails?.email;
          data["country"] = shopDetails?.country;
          data["currency"] = shopDetails?.currency;
          data["ordersCount"] = shopDetails?.ordersCount;
          data["ordersSum"] = shopDetails?.ordersSum;
          data["shopCreatedAt"] = shopDetails?.createdAt;
        }

        await setAppInstalledDate(session, data);
        await sendDataAppInstallTopicPubSub(data);
        await fireStoreDeleteService("AppUninstalledDate", session.shop);
      } else {
        console.log("App is already installed");
      }
    },
  },
  billing: {
    [STARTER_PLAN]: {
      amount: 19,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    [PRO_PLAN]: {
      amount: 49,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    [ADVANCE_PLAN]: {
      amount: 99,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    [STARTER_PLAN_YEARLY]: {
      amount: 205.2,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Annual,
    },
    [PRO_PLAN_YEARLY]: {
      amount: 470.4,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Annual,
    },
    [ADVANCE_PLAN_YEARLY]: {
      amount: 831.6,
      trialDays: 7,
      isTest: false,
      currencyCode: 'USD',
      interval: BillingInterval.Annual,
    }
  },
  restResources,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
