import { useNavigate } from '@remix-run/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { LanguageFilledIcon } from '@shopify/polaris-icons';
import { Icon, Select, Spinner, Text } from '@shopify/polaris';
import TopSaleBanner from '~/components/global/TopSaleBanner';
import WhatWeDoSection from '../../WelcomPage/WhatWeDoSection';
import OnboardingSteps from '../OnboardingSteps/OnboardingSteps';
import Overview from '~/components/global/Overview/Overview';

export default function WelcomePage({
    loaderData,
    actionData,
    handleLanguageChange,
    selectedLanguage,
    setSelectedLanguage,
    anySubscription,
    shop
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
        <div className="bg-[#f1f1f1]">
            <div className='start_page start_page_wrapper sm:!max-w-[100%]  px-4 md:px-0'>
                <div className="lets_start_main_container dashboard_page_wrap">
                    <TopSaleBanner
                        btnClass="saleBannerButton"
                        className='abandoned_banner_welcome_page cursor-pointer'
                    />
                    <div className='flex flex-row justify-between mb-6 mt-6'>
                        <div>
                            <Text variant="headingLg" as="h5">
                                {t("homePostPayment.title")}
                            </Text>
                            <p className="text-[13px]  mt-[6px]">
                                {t("homePostPayment.subTitle")}
                            </p>
                        </div>
                        <Select
                            label=""
                            options={languageOptions}
                            onChange={handleLanguageChange}
                            value={selectedLanguage}
                        />
                    </div>
                    <OnboardingSteps
                        t={t}
                        shop={shop}
                    />
                    {/* <div className="w-full flex justify-center mb-6">
                                <TopSaleBanner btnClass="saleBannerButton" src={"/images/letsStartPage/topBanner.png"} className="cursor-pointer" />
                            </div> */}

                    <div>
                        <WhatWeDoSection t={t} />
                    </div>
                    <div className='mt-6'>
                        <Overview />
                    </div>
                </div>
            </div >
        </div >
    )
}
