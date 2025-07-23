import { Badge, Button, Card, Page, Text, SkeletonDisplayText } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { redirect, useActionData, useNavigate, useOutletContext, useSubmit } from '@remix-run/react';
import { authenticate } from "../shopify.server";
import StartPageCartSummary from '~/components/StartPageCartSummary';
import fireStoreFetchService from '~/services/fireStoreFetchService';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import AbandonedCartSVG from '~/components/SVGs/AbandonedCartSVG';
import MissedRevenueSVG from '~/components/SVGs/MissedRevenueSVG';
import RecoveredRevenueSVG from '~/components/SVGs/RecoveredRevenueSVG';
import ACRRateSVG from '~/components/SVGs/ACRRateSVG';
import { useTranslation } from 'react-i18next';
import PlanSection from '~/components/Settings/PlanSection';

export const action = async ({ request }: any) => {
    const { session } = await authenticate.admin(request)
    const formData = await request.formData();
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
    const [isLoadingPlanButton, setLoadingPlanButton] = useState(null)
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
            if (actionData?.planName === "Free") {
                setAnySubscription(true)
                setPlanName(planName);
                setSelectedPlanName("Free")
                shopify.toast.show(t("global.toastMessage.successSubscriptionCreated"));
                navigate('/app')
            }
        }
    }, [actionData])

    useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);


    const handlePlanSelect = (planName: any) => {
        setLoadingPlanButton(planName)
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    return (
        <div className="body">
            <div className='start_page'>
                <div className="letstart">
                    {/* <Page fullWidth> */}
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
                        <div className='mb-20'></div>
                        <PlanSection
                            t={t}
                            loadingPage={false}
                            loadingButton={isLoadingPlanButton}
                            planName={planName}
                            handlePlanSelect={handlePlanSelect}
                            pageType={"letsStart"}
                        />
                    </div>
                    {/* </Page> */}
                </div>
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
