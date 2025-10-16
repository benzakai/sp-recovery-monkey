import { useNavigate } from '@remix-run/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next';
import DashboardSVG from '../SVGs/DashboardSVG';
import CustomerListSVG from '../SVGs/CustomerListSVG';
import Dashboard2SVG from '../SVGs/Dashboard2SVG';
import { LanguageFilledIcon } from '@shopify/polaris-icons';
import { Button, Card, Icon, Select, Text } from '@shopify/polaris';
import StartPageCartSummary from '../StartPageCartSummary';
import ChatSVG from '../SVGs/ChatSVG';
import MailSVG from '../SVGs/MailSVG';

export default function WelcomePlanPage({
    loaderData,
    actionData,
    handleLanguageChange,
    selectedLanguage,
    setSelectedLanguage,
    anySubscription,
}: any) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate();
    const anySubscriptionRef = useRef(anySubscription);

    useEffect(() => {
        if (loaderData) {
            setSelectedLanguage(loaderData.userSelectedLanguage)
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData?.success) {
           if (actionData?.savedAppLangnuage) {
                i18n.changeLanguage(actionData?.savedAppLangnuage)
                shopify.toast.show(t("global.toastMessage.languageChangeSuccess"))
            }
        }
    }, [actionData]);

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
                </div>
            </div>
        </div>
    )
}
