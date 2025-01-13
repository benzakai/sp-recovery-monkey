import { Badge, Button, Card, Page, Text, SkeletonDisplayText } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { redirect, useActionData, useNavigate, useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import StartPageCartSummary from '~/components/StartPageCartSummary';
import fireStoreFetchService from '~/services/fireStoreFetchService';
import fireStoreCreateService from '~/services/fireStoreCreateService';

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

    useEffect(() => {
        if (actionData?.success) {
            if (planName === "Free") {
                navigate('/app/WelcomeConnect')
            }
        }
    }, [actionData])

    const handlePlanSelect = (planName: any) => {
        if (planName === "Free") setLoadingPlanButton(true)
        setPlanName(planName);
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='lets_start_main_container'>
                        <div className='start_main_container_heading pb-8'>
                            <Text variant="heading3xl" as="h3" >
                                Let’s Start!
                            </Text>
                        </div>

                        <div>
                            <p className='font-bold text-2xl pb-6'>Here’s a Dashboard of Your Lost Revenue</p>
                            <StartPageCartSummary getPageData={getPageData} />
                        </div>

                        <div className="start_price_container">
                            <div className="start_price_container_heading">
                                <Text variant="headingLg" as="h5">
                                    Choose a plan and start Growing!
                                </Text>
                            </div>
                            <div className="start_price_container_cards">
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Free Plan</div>
                                        <div className="start_plan_ammount_section" style={{ marginBottom: "75px" }}>
                                            <div className="start_plan_ammount">Free</div>
                                        </div>

                                        <div className="start_plan_button_section"><Button size='large' loading={isLoadingPlanButton} onClick={() => handlePlanSelect('Free')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 5 sales recovery carts</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $1,000 in additional revenue per month!</li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Starter</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">19$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge size="small" tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $2,000 in additional revenue per month!</li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Pro</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">49$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 49 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $10,000 in additional revenue per month!</li>
                                            </ul>

                                        </div>
                                    </div>
                                    <div className='popular_badge'>
                                        Most Popular
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Advanced</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">99$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 100 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $100000 more revenue per month</li>
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
