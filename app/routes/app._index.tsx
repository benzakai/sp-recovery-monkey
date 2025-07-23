import { Spinner, Card, Button, Text, Page, Badge, Select, Icon } from '@shopify/polaris';
import { useNavigate, useActionData, useSubmit, useOutletContext, useLoaderData } from '@remix-run/react';
import '../StartPage.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import { authenticate } from '~/shopify.server';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import DashboardSVG from '~/components/SVGs/DashboardSVG';
import CustomerListSVG from '~/components/SVGs/CustomerListSVG';
import Dashboard2SVG from '~/components/SVGs/Dashboard2SVG';
import ChatSVG from '~/components/SVGs/ChatSVG';
import MailSVG from '~/components/SVGs/MailSVG';
import { useTranslation } from 'react-i18next';
import { LanguageFilledIcon } from '@shopify/polaris-icons';
import db from '../db.server';
import PlanSection from '~/components/Settings/PlanSection';
export interface Card {
  id: number;
  icon: JSX.Element;
  value: any;
  title: string;
  description: string;
  handleNavigate: () => void;
}

export interface StartPageCartSummaryProps {
  getCards: Card[];
}

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
  const { t, i18n } = useTranslation()
  const loaderData: any = useLoaderData()
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('not set');
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(null);
  const submit = useSubmit();
  const actionData: any = useActionData();
  const { anySubscription, setAnySubscription, setSelectedPlanName }: any = useOutletContext();
  const anySubscriptionRef = useRef(anySubscription);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const getCards = useMemo(
    () => [
      {
        id: 1,
        icon: <DashboardSVG />,
        value: null,
        title: t("global.icons.dashboard"),
        description: t("global.icons.dashboardDescription"),
        handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/WelcomeConnect" : null)
      },
      {
        id: 2,
        icon: <CustomerListSVG />,
        value: null,
        title: t("global.icons.customerList"),
        description: t("global.icons.customerListDescription"),
        handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/AbandonedList" : null)
      },
      {
        id: 3,
        icon: <Dashboard2SVG />,
        value: null,
        title: t("global.icons.bulkCampaign"),
        description: t("global.icons.bulkCampaignDescription"),
        handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/SmartBulk" : null)
      }
    ],
    [anySubscriptionRef.current, t]);

  useEffect(() => {
    if (loaderData) {
      setSelectedLanguage(loaderData.userSelectedLanguage)
    }
  }, [loaderData])

  useEffect(() => {
    if (actionData?.success) {
      if (actionData?.planName === "Free") {
        setSelectedPlanName("Free")
        setPlanName(planName);
        setAnySubscription(true);
        shopify.toast.show(t("global.toastMessage.successSubscriptionCreated"));
      } else if (actionData?.savedAppLangnuage) {
        i18n.changeLanguage(actionData?.savedAppLangnuage)
        shopify.toast.show(t("global.toastMessage.languageChangeSuccess"))
      }
    }
  }, [actionData, planName, setAnySubscription]);

  useEffect(() => {
    anySubscriptionRef.current = anySubscription;
  }, [anySubscription]);

  const handleIconsNavigate = useCallback((data: any) => {
    if (anySubscriptionRef.current !== "loading") {
      data ? navigate(data) : shopify.toast.show(t("global.toastMessage.pagePlanLimit"));
    } else {
      shopify.toast.show(t("global.toastMessage.loadingSubscription"));
    }
  }, [anySubscription, navigate])

  const handleRedirectToMail = useCallback(() => {
    try {
      const mailtoLink = `mailto:david@cartkeeper.co`;
      const newWindow = window.open(mailtoLink, '_blank');
      if (!newWindow) {
        throw new Error('Failed to open mail client. The popup might be blocked.');
      }
    } catch (error) {
      console.error("Error on opening a mail:", error);
    }
  }, [])

  const handleRedirectToWhatsapp = useCallback(() => {
    window.open("https://wa.me/+972555081948", "_blank");
  }, [])

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


  const languageOptions = [
    {
      label: 'English',
      value: 'en',
      prefix: <Icon source={LanguageFilledIcon} />,
    },
    {
      label: 'Español',
      value: 'es',
      prefix: <Icon source={LanguageFilledIcon} />,
    },
    {
      label: 'Português',
      value: 'pt',
      prefix: <Icon source={LanguageFilledIcon} />,
    },
    {
      label: 'Français',
      value: 'fr',
      prefix: <Icon source={LanguageFilledIcon} />,
    },
    {
      label: 'Deutsch',
      value: 'de',
      prefix: <Icon source={LanguageFilledIcon} />,
    }
  ];


  return (
    <div className="body">
      <div className='start_page'>
        <div className='start_main_container'>
          <div className='flex flex-row justify-between'>
            <div className='start_main_container_heading pb-8'>
              <Text variant="heading3xl" as="h3">
                {t("home.title")}
              </Text>
            </div>
            <Select
              label=""
              options={languageOptions}
              onChange={handleLanguageChange}
              value={selectedLanguage}
            />
          </div>

          <div>
            <p className='font-bold text-2xl pb-6'>{t("home.subTitle")}</p>
            <StartPageCartSummary getCards={getCards} />
          </div>

          <div className="start_price_container contact-block">
            <div className="start_price_container_heading">
              <Text variant="headingLg" as="h5">
                {t("home.contactSectionTitle")}
              </Text>
            </div>

            <Card>
              <div className="flex flex-row gap-6 p-6 w-full">
                <div className="p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48 w-1/2" style={{ backgroundColor: "#f8faff" }}>
                  <div className='flex flex-row items-center'>
                    <ChatSVG />
                    <h2 className="text-lg font-semibold text-gray-800">{t("home.whatsappChatTitle")}</h2>
                  </div>
                  <div className='mb-4 mt-4'>
                    <p className="text-gray-600 text-base">{t("home.whatsappChatDescription")}</p>
                  </div>
                  <div>
                    <Button fullWidth size='large' variant='primary' onClick={handleRedirectToWhatsapp}>
                      {t("home.whatsappChatButtonText")}
                    </Button>
                  </div>
                </div>

                <div className="p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48 w-1/2" style={{ backgroundColor: "#f8faff" }}>
                  <div className='flex flex-row items-center'>
                    <MailSVG />
                    <h2 className="text-lg font-semibold text-gray-800">{t("home.emailContactTitle")}</h2>
                  </div>
                  <div className='mb-4 mt-4'>
                    <p className="text-gray-600 text-base">{t("home.emailContactDescription")}</p>
                  </div>
                  <div className={i18n.language === "en" ? "mt-10" : ""}>
                    <Button fullWidth size='large' variant='primary' onClick={handleRedirectToMail}>
                      {t("home.emailContactButtonText")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className='mb-20'></div>
          {anySubscription === "loading" ? (
            // <div className="flex justify-center items-center h-full w-full mt-28">
            //   <Spinner accessibilityLabel="Spinner example" size="large" />
            // </div>
            <></>
          ) : (
            !anySubscription && (
              <PlanSection
                t={t}
                loadingPage={false}
                loadingButton={isLoadingPlanButton}
                planName={planName}
                handlePlanSelect={handlePlanSelect}
                pageType={"welcome"}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}