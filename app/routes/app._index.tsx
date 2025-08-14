import { useActionData, useSubmit, useLoaderData, useOutletContext } from '@remix-run/react';
import '../StartPage.css';
import { useEffect, useState } from 'react';
import { authenticate } from '~/shopify.server';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import db from '../db.server';
import WelcomePlanPage from '~/components/PlanPage/WelcomePlanPage';
import { Spinner } from '@shopify/polaris';
import CartKeeperWelcome from '~/components/HomePage/CartKeeperWelcome';

export const action = async ({ request }: any) => {
  const { session, billing } = await authenticate.admin(request)
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const selectedAppLanugage = formData.get("selectedAppLanugage");
  const planName = formData.get("planName");
  let savedLanguage;
  if (actionType === "languageChange") {
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
  } else if (actionType === "planSelect") {
    if (planName === "Free") {
      await fireStoreCreateService("subscriptions", session.shop, {
        storeId: session.shop,
        plan: "Free",
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        endDate: ""
      }, {});
    } else {
      await billing.require({
        plans: [planName],
        isTest: false,
        onFailure: async () => billing.request({
          plan: planName,
          isTest: false
        }),
      });
    }
  }
  return { success: true, savedAppLangnuage: savedLanguage?.language, planName };
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
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(null);
  const submit = useSubmit();
  const actionData: any = useActionData();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { anySubscription, setAnySubscription, setSelectedPlanName }: any = useOutletContext();

  const handlePlanSelect = (planName: any) => {
    setLoadingPlanButton(planName)
    const formData = new FormData();
    formData.append("planName", planName);
    formData.append("actionType", "planSelect");
    submit(formData, { method: "post" });
  };

  const handleLanguageChange = (value: any) => {
    setSelectedLanguage(value);
    const formData = new FormData()
    formData.append("selectedAppLanugage", value);
    formData.append("actionType", "languageChange");
    submit(formData, { method: "post" });
  }

  useEffect(() => {
    console.log("anySubscription", anySubscription)
  }, [anySubscription])


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
            handlePlanSelect={handlePlanSelect}
            handleLanguageChange={handleLanguageChange}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            isLoadingPlanButton={isLoadingPlanButton}
            anySubscription={anySubscription}
            setAnySubscription={setAnySubscription}
            setSelectedPlanName={setSelectedPlanName}
          />
          :
          <CartKeeperWelcome />
      )}
    </>
  );
}