import { useActionData, useSubmit, useLoaderData, useOutletContext } from '@remix-run/react';
import '../StartPage.css';
import { useEffect, useState } from 'react';
import { authenticate } from '~/shopify.server';
import db from '../db.server';
import WelcomePlanPage from '~/components/PlanPage/WelcomePlanPage';
import { Spinner } from '@shopify/polaris';
import CartKeeperWelcome from '~/components/HomePage/CartKeeperWelcome';
// import { trackLCP } from '~/utils/lcpTracker';

export const action = async ({ request }: any) => {
  const { session } = await authenticate.admin(request)
  const formData = await request.formData();
  try {
    const selectedAppLanugage = formData.get("selectedAppLanugage");
    let savedLanguage;
    const existingLanguage = await db.appLanguages.findUnique({
      where: {
        shop: session.shop,
      },
    });

    if (existingLanguage) {
      savedLanguage = await db.appLanguages.update({
        where: {
          shop: session.shop,
        },
        data: {
          language: selectedAppLanugage,
        },
      });
    } else {
      savedLanguage = await db.appLanguages.create({
        data: {
          language: selectedAppLanugage,
          shop: session.shop,
        },
      });
    }
    return { success: true, savedAppLangnuage: savedLanguage?.language };
  } catch (error) {
    console.log("error occured on app._index action", error)
    return {}
  }
};

export const loader = async ({ request }: any) => {
  const { session } = await authenticate.admin(request);
  const languageData = await db.appLanguages.findUnique({
    where: {
      shop: session.shop
    }
  })
  return { userSelectedLanguage: languageData?.language || "en" };
}

export default function Index() {
  const loaderData: any = useLoaderData()
  const submit = useSubmit();
  const actionData: any = useActionData();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { anySubscription }: any = useOutletContext();

  const handleLanguageChange = (value: any) => {
    setSelectedLanguage(value);
    const formData = new FormData()
    formData.append("selectedAppLanugage", value);
    formData.append("actionType", "languageChange");
    submit(formData, { method: "post" });
  }

  // useEffect(() => {
  //   trackLCP('MainPage');
  // }, []);


  return (
    <>
      {anySubscription === "loading" ? (
        <div className="flex justify-center items-center h-full w-full">
          <Spinner accessibilityLabel="Spinner example" size="large" />
        </div>
      ) : (
        anySubscription ?
          <WelcomePlanPage
            loaderData={loaderData}
            actionData={actionData}
            handleLanguageChange={handleLanguageChange}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            anySubscription={anySubscription}
          />
          :
          <CartKeeperWelcome />
      )}
    </>
  );
}