import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const [planStatus,setPlanStatus] = useState('INACTIVE');
  const navigate = useNavigate();

  const getDataFromFirestore = async () => {
    const response = await fetch('/api/firestore?collectionName=subscriptions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const Responsedata = await response.json();
    if(Responsedata.data){
       console.log('plans data',Responsedata.data);
       return Responsedata.data;
    }else{
      return null;
    }
  };

  useEffect(()=>{
    const getFireData = async()=>{
      const fireStoreData = await getDataFromFirestore();
      if(Object.keys(fireStoreData).length === 0){
        console.log('INACTIVE');
        navigate("/app/LetsStart");
        setPlanStatus('INACTIVE');
      }else{
        console.log('ACTIVE');
        navigate("/app/WelcomeConnect");
        setPlanStatus('ACTIVE');
      }
      
    }

    getFireData();
  },[]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      
        {/* <Link to="/app" rel="home">
          Home
        </Link> */}
        {planStatus == 'INACTIVE'?(
          <NavMenu>
            <Link to="/app/LetsStart">let’s Start </Link>
          </NavMenu>
          
        ):(
          <NavMenu>
            {/* <Link to="/app/welcome">Welcome</Link> */}
            <Link to="/app/WelcomeConnect">Welcome</Link> 
            <Link to="/app/AbandonedList">Abandoned List</Link>
            {/* <Link to="/app/abandoned-list">Abandoned List</Link> */}
            <Link to="/app/convert">Convert</Link>
            {/* <Link to="/app/connect">Connect</Link> */}
            <Link to="/app/UpgradePlan">Upgrade Plan</Link>
            
          </NavMenu>
        )}
        
        
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
