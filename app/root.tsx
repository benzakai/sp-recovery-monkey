import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css?url";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";
import { authenticate } from "./shopify.server";
import db from './db.server'

interface LoaderData {
  userSelectedLanguage: string;
}


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request)
  // console.log("session from rooot", session.shop);
  const languageData = await db.appLanguages.findUnique({
    where: {
      shop: session.shop
    }
  })
  // console.log(
  //   "languageData----------------------------------------->",
  //   languageData,
  // );
  return { userSelectedLanguage: languageData?.language || "en" };
}

export default function App() {
  // console.log("loaded");
  const { userSelectedLanguage }: LoaderData = useLoaderData();
  const { i18n } = useTranslation();

  useChangeLanguage(userSelectedLanguage);

  return (
    <html lang={userSelectedLanguage} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
