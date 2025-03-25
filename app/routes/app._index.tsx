import { Spinner, Card, Button, Text, Page, Badge, Select, Icon } from '@shopify/polaris';
import { useNavigate, useActionData, useSubmit, useOutletContext, useLoaderData } from '@remix-run/react';
import '../StartPage.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import { authenticate, MONTHLY_PLAN } from '~/shopify.server';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import DashboardSVG from '~/components/SVGs/DashboardSVG';
import CustomerListSVG from '~/components/SVGs/CustomerListSVG';
import Dashboard2SVG from '~/components/SVGs/Dashboard2SVG';
import ChatSVG from '~/components/SVGs/ChatSVG';
import MailSVG from '~/components/SVGs/MailSVG';
import { useTranslation } from 'react-i18next';
import { LanguageFilledIcon } from '@shopify/polaris-icons';
import db from '../db.server';
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
    const planName = formData.get("planName") || MONTHLY_PLAN;
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
  return { success: true, savedAppLangnuage: savedLanguage?.language };
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
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(false);
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
      if (planName === "Free") {
        setSelectedPlanName("Free")
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
    if (planName === "Free") setLoadingPlanButton(true)
    setPlanName(planName);
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
    }
  ];


  return (
    <div className="body">
      <div className='start_page'>
        <div className='start_main_container' style={{ padding: "4rem 12rem 10rem 6rem" }}>
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

          <div className="start_price_container">
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

          {anySubscription === "loading" ? (
            <div className="flex justify-center items-center h-full w-full mt-28">
              <Spinner accessibilityLabel="Spinner example" size="large" />
            </div>
          ) : (
            !anySubscription && (
              <div className="start_price_container">
                <div className="start_price_container_heading">
                  <Text variant="headingLg" as="h5">
                    {t("home.priceSectionTitle")}
                  </Text>
                </div>
                <div className="start_price_container_cards">
                  <Card>
                    <div className="start_price_choose_plan">
                      <div className='start_plan_name'>{t("settings.planName1")}</div>
                      <div className="start_plan_ammount_section" style={{ marginBottom: "75px" }}>
                        <div className="start_plan_ammount">{t("settings.planPrice1")}</div>
                      </div>
                      <div className="start_plan_button_section"><Button size='large' loading={isLoadingPlanButton} onClick={() => handlePlanSelect('Free')} variant='primary' fullWidth>{t("settings.planNotSelectedText")}</Button></div>
                      <div className="star_plan_limit_dialogue">
                        <ul className='start_plan_list'>
                          <li className='start_plan_list_item'>- {t("settings.freeBenefit1")}</li>
                          <li className='start_plan_list_item'>- {t("settings.freeBenefit2")}</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="start_price_choose_plan">
                      <div className='start_plan_name'>{t("settings.planName2")}</div>
                      <div className="start_plan_ammount_section">
                        <div className="start_plan_ammount">19$</div>
                        <div className="start_plan_ammount_suffix">{t("settings.planPrice2")}</div>
                      </div>
                      <div className="start_plan_trial"><Badge size="small" tone="info">{t("settings.freeTrileText")}</Badge> </div>
                      <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>{t("settings.planNotSelectedText")}</Button></div>
                      <div className="star_plan_limit_dialogue">
                        <ul className='start_plan_list'>
                          <li className='start_plan_list_item'>- {t("settings.starterBenefit1")}</li>
                          <li className='start_plan_list_item'>- {t("settings.starterBenefit2")}</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="start_price_choose_plan">
                      <div className='start_plan_name'>{t("settings.planName3")}</div>
                      <div className="start_plan_ammount_section">
                        <div className="start_plan_ammount">49$</div>
                        <div className="start_plan_ammount_suffix">{t("settings.planPrice3")}</div>
                      </div>
                      <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                      <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>{t("settings.planNotSelectedText")}</Button></div>
                      <div className="star_plan_limit_dialogue">
                        <ul className='start_plan_list'>
                          <li className='start_plan_list_item'>- {t("settings.proBenefit1")}</li>
                          <li className='start_plan_list_item'>- {t("settings.proBenefit2")}</li>
                          <li className='start_plan_list_item'>- {t("settings.proBenefit3")}</li>
                          <li className='start_plan_list_item'>- {t("settings.proBenefit4")}</li>
                          <li className='start_plan_list_item'>- {t("settings.proBenefit5")}</li>
                        </ul>
                      </div>
                    </div>
                    <div className='popular_badge'>
                      {t("settings.popularBadgeText")}
                    </div>
                  </Card>
                  <Card>
                    <div className="start_price_choose_plan">
                      <div className='start_plan_name'>{t("settings.planName4")}</div>
                      <div className="start_plan_ammount_section">
                        <div className="start_plan_ammount">99$</div>
                        <div className="start_plan_ammount_suffix">{t("settings.planPrice4")}</div>
                      </div>
                      <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                      <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>{t("settings.planNotSelectedText")}</Button></div>
                      <div className="star_plan_limit_dialogue">
                        <ul className='start_plan_list'>
                          <li className='start_plan_list_item'>- {t("settings.advancedBenefit1")}</li>
                          <li className='start_plan_list_item'>- {t("settings.advancedBenefit2")}</li>
                          <li className='start_plan_list_item'>- {t("settings.advancedBenefit3")}</li>
                          <li className='start_plan_list_item'>- {t("settings.advancedBenefit4")}</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}