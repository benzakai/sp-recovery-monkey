import { useEffect, useState } from 'react';
import '../StartPage.css';
import { useActionData, useLoaderData, useNavigate, useOutletContext, useSubmit } from '@remix-run/react';
import { authenticate } from "../shopify.server";
import fireStoreCreateService from '~/services/fireStoreCreateService';
import { useTranslation } from 'react-i18next';
import PlanSection from '~/components/Settings/PlanSection';
import db from '../db.server';
import WelcomePage from '~/components/HomePage/WelcomePage/WelcomePage';
import { manageOnboarding } from '~/lib/onboarding/common';


export const action = async ({ request }: any) => {
  const { session } = await authenticate.admin(request)
  const formData = await request.formData();
  const type = formData.get("type");
  if (type === "managePlan") {
    const planName = formData.get("planName");
    // console.log("planName", planName);
    if (planName === "Free") {
      await fireStoreCreateService("subscriptions", session.shop, {
        storeId: session.shop,
        plan: "Free",
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        endDate: ""
      }, {});
    } else {
      const { billing } = await authenticate.admin(request);
      const okay = await billing.require({
        plans: [planName],
        isTest: false,
        onFailure: async () => billing.request({
          plan: planName,
          isTest: false
        }),
      });
    }
    return { success: true, planName };
  } else {
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
  }
};

export const loader = async ({ request }: any) => {
  const { session } = await authenticate.admin(request);
  const languageData = await db.appLanguages.findUnique({
    where: {
      shop: session.shop
    }
  })
  return { userSelectedLanguage: languageData?.language || "en", shop: session.shop };
}

export default function Index() {

  const { t } = useTranslation()
  const [planName, setPlanName] = useState('not set');
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(null)
  const submit = useSubmit();
  const loaderData: any = useLoaderData()
  const actionData = useActionData()
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { setSelectedPlanName, selectedPlanName }: any = useOutletContext()

  useEffect(() => {
    if (actionData?.success) {
      if (actionData?.planName === "Free") {
        setPlanName(actionData?.planName);
        setSelectedPlanName(actionData?.planName)
        setLoadingPlanButton(null)
        shopify.toast.show(t("global.toastMessage.successSubscriptionCreated"));
      }
    }
  }, [actionData])

  useEffect(() => {
    if (selectedPlanName) {
      setPlanName(selectedPlanName)
    }
  }, [selectedPlanName])

  useEffect(() => {
    manageOnboarding({ data: {} });
  }, [])

  const handlePlanSelect = (planName: any) => {
    setLoadingPlanButton(planName)
    const formData = new FormData();
    formData.append("type", "managePlan");
    formData.append("planName", planName);
    submit(formData, { method: "post" });
  };

  const handleLanguageChange = (value: any) => {
    setSelectedLanguage(value);
    const formData = new FormData()
    formData.append("type", "manageLanguage");
    formData.append("selectedAppLanugage", value);
    formData.append("actionType", "languageChange");
    submit(formData, { method: "post" });
  }

  return (
    <WelcomePage
      loaderData={loaderData}
      actionData={actionData}
      handleLanguageChange={handleLanguageChange}
      selectedLanguage={selectedLanguage}
      setSelectedLanguage={setSelectedLanguage}
      shop={loaderData.shop}
      PlanSect={<PlanSection
        t={t}
        loadingPage={false}
        loadingButton={isLoadingPlanButton}
        planName={planName}
        handlePlanSelect={handlePlanSelect}
        pageType={"home"}
      />}
    />
  );

};
