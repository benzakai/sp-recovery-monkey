import { Badge, Button, Card, Page, Text, SkeletonDisplayText } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { redirect, useActionData, useNavigate, useOutletContext, useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import StartPageCartSummary from '~/components/StartPageCartSummary';
import fireStoreFetchService from '~/services/fireStoreFetchService';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import AbandonedCartSVG from '~/components/SVGs/AbandonedCartSVG';
import MissedRevenueSVG from '~/components/SVGs/MissedRevenueSVG';
import RecoveredRevenueSVG from '~/components/SVGs/RecoveredRevenueSVG';
import ACRRateSVG from '~/components/SVGs/ACRRateSVG';
import { useTranslation } from 'react-i18next';

export const action = async ({ request }: any) => {
    const { session } = await authenticate.admin(request)
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;
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
    return { success: true };
};

const LetsStart = () => {
    const { t } = useTranslation()
    const [getPageData, setPageData] = React.useState({
        abandonedCarts: [],
        abandonedCartsSum: 0,
        acrRate: null,
        allCarts: [],
        recoveredCarts: [],
        recoveredCartsSum: 0,
        shopCurrency: null,
        success: null
    });
    const [planName, setPlanName] = useState('not set');
    const [isLoadingPlanButton, setLoadingPlanButton] = useState(false)
    const submit = useSubmit();
    const actionData = useActionData()
    const navigate = useNavigate()
    const { setAnySubscription, setSelectedPlanName }: any = useOutletContext()
    const [getCards, setCards] = React.useState([
        {
            id: 1,
            value: "Loading",
            icon: <AbandonedCartSVG />,
            title: t("global.icons.abandonedCarts"),
            description: t("global.icons.abandonedCartsDescription"),
            handleNavigate: () => { }
        },
        {
            id: 2,
            value: "Loading",
            icon: <MissedRevenueSVG />,
            title: t("letsStart.missedRevenue"),
            description: t("letsStart.missedRevenueDescription"),
            handleNavigate: () => { }
        },
        {
            id: 3,
            value: "Loading",
            icon: <RecoveredRevenueSVG />,
            title: t("global.icons.recoveredRevenue"),
            description: t("global.icons.recoveredRevenueDescription"),
            handleNavigate: () => { }
        },
        {
            id: 4,
            value: "Loading",
            icon: <ACRRateSVG />,
            title: t("global.icons.ACRRate"),
            description: t("global.icons.ACRRateDescription"),
            handleNavigate: () => { }
        }
    ]);

    useEffect(() => {
        if (getPageData && getPageData?.success) {
            // console.log("triggered", getPageData);
            setCards([
                {
                    id: 1,
                    value: getPageData?.abandonedCarts?.length,
                    icon: <AbandonedCartSVG />,
                    title: t("global.icons.abandonedCarts"),
                    description: t("global.icons.abandonedCartsDescription"),
                    handleNavigate: () => { }
                },
                {
                    id: 2,
                    value: `${getPageData?.shopCurrency}${getPageData?.abandonedCartsSum}`,
                    icon: <MissedRevenueSVG />,
                    title: t("letsStart.missedRevenue"),
                    description: t("letsStart.missedRevenueDescription"),
                    handleNavigate: () => { }
                },
                {
                    id: 3,
                    value: `${getPageData?.shopCurrency}${getPageData?.recoveredCartsSum}`,
                    icon: <RecoveredRevenueSVG />,
                    title: t("global.icons.recoveredRevenue"),
                    description: t("global.icons.recoveredRevenueDescription"),
                    handleNavigate: () => { }
                },
                {
                    id: 4,
                    value: isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`,
                    icon: <ACRRateSVG />,
                    title: t("global.icons.ACRRate"),
                    description: t("global.icons.ACRRateDescription"),
                    handleNavigate: () => { }
                }
            ]);
        }
    }, [getPageData]);

    useEffect(() => {
        if (actionData?.success) {
            if (planName === "Free") {
                setAnySubscription(true)
                setSelectedPlanName("Free")
                navigate('/app/WelcomeConnect')
            }
        }
    }, [actionData])

    useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);


    const handlePlanSelect = (planName: any) => {
        if (planName === "Free") setLoadingPlanButton(true)
        setPlanName(planName);
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='lets_start_main_container'>
                        <div className='start_main_container_heading pb-8'>
                            <Text variant="heading3xl" as="h3" >
                                {t("letsStart.title")}
                            </Text>
                        </div>

                        <div>
                            <p className='font-bold text-2xl pb-6'>{t("letsStart.subTitle")}</p>
                            <StartPageCartSummary getCards={getCards} />
                        </div>

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
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>select</Button></div>
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
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>select</Button></div>
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
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>select</Button></div>
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
                    </div>
                </Page>
            </div>
        </div>
    );

    async function handleFetchAbandonedCheckouts() {
        try {
            const appSubscription = await fetchAppSubscription();
            // console.log("appSubscription from letsStart", appSubscription?.activeSubscriptions?.[0]?.createdAt);

            const response = await fetch("/api/abandoned-checkouts/get", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    appSubscriptionCreated: appSubscription?.activeSubscriptions?.[0]?.createdAt,
                    pageName: "letsStart"
                })
            });

            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();
                // console.log("responseData letsStart", responseData);

                if (responseData.success == true) {
                    setPageData({ ...responseData });
                }
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error on letsStart", error);
        }
    }

    async function fetchAppSubscription() {
        try {
            const response = await fetch("/api/active/subscription/get");
            if (response.ok == true && response.status == 200) {
                const responseJson = await response.json();
                return responseJson;
            }
        } catch (error) {
            console.log("fetchAppSubscription ERROR on letsStart", error);
        }
    }
};

export default LetsStart;
