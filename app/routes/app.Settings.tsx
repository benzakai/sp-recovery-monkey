import { Badge, BlockStack, Button, Card, Page, SkeletonBodyText, SkeletonDisplayText, Spinner, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN, STARTER_PLAN, PRO_PLAN, ADVANCE_PLAN } from "../shopify.server";
import { ActionFunctionArgs, useActionData, useNavigate } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';
import fireStoreCreateService from '~/services/fireStoreCreateService';


export const action = async ({ request }) => {
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;
    const { billing, session } = await authenticate.admin(request);

    if (planName === "Free") {
        const billingCheck = await billing.require({
            plans: [MONTHLY_PLAN, STARTER_PLAN, PRO_PLAN, ADVANCE_PLAN],
            onFailure: async () => billing.request({ plan: MONTHLY_PLAN }),
        });

        const subscription = billingCheck.appSubscriptions[0];
        const cancelledSubscription = await billing.cancel({
            subscriptionId: subscription.id,
            isTest: false,
            // prorate: true,
        });
        // console.log("cancelledSubscription", cancelledSubscription);

        await fireStoreCreateService("subscriptions", session.shop, {
            storeId: session.shop,
            plan: "Free",
            status: "ACTIVE",
            startDate: new Date().toISOString(),
            endDate: ""
        }, {});
    } else {
        const okay = await billing.require({
            plans: [planName],
            isTest: false,
            trialDays: 0,
            onFailure: async () => billing.request({
                plan: planName,
                isTest: false,
                trialDays: 0
            }),
        });
    }


    return { success: true, planName };
};


const Settings = () => {
    const [planName, setPlanName] = useState('not set');
    const [isLoadingPlanButton, setLoadingPlanButton] = useState(false)
    const submit = useSubmit();
    const [loadingPage, setLoadingPage] = useState(true)
    const actionData = useActionData()

    useEffect(() => {
        if (actionData?.success) {
            if (actionData?.planName === "Free") {
                setLoadingPlanButton(false)
                setPlanName(actionData?.planName)
            }
        }
    }, [actionData])

    const handlePlanSelect = (planName) => {
        if (planName === "Free") setLoadingPlanButton(true)
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    const getDataFromFirestore = async () => {
        const response = await fetch('/api/firestore?collectionName=subscriptions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const Responsedata = await response.json();
        if (Responsedata.data) {
            return Responsedata.data;
        } else {
            return null;
        }
    };

    useEffect(() => {
        const getFireData = async () => {
            const fireStoreData = await getDataFromFirestore();
            if (Object.keys(fireStoreData).length === 0) {
                setPlanName('NO_PLAN');
            } else {
                setPlanName(fireStoreData?.plan);
            }
            setLoadingPage(false)
        }
        getFireData();
    }, []);

    return (

        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div className='start_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                Let’s Plan
                            </Text>
                        </div>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingXl" as="h4">
                                Choose the right plan for your needs
                            </Text>
                        </div>
                        <div className="start_price_container">
                            <div className="upgrade_page_container_heading">
                                {loadingPage ? <div className='w-56'><SkeletonBodyText lines={2} /> </div>:
                                    <div className='upgrade_page_container_heading_text'>Your Current Plan is {planName}</div>}
                            </div>
                            <div className="start_price_container_cards">
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Free Plan</div>
                                        <div className="start_plan_ammount_section" style={{ marginBottom: "145px" }}>
                                            <div className="start_plan_ammount">Free</div>
                                        </div>

                                        <div className="start_plan_button_section" >
                                            {/* {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${30}ch`} />
                                                :
                                                <Button size='large' disabled={planName === "Free"} loading={isLoadingPlanButton} onClick={() => handlePlanSelect('Free')} variant='primary' fullWidth>
                                                    {planName == 'Free' ? 'selected' : 'select'}
                                                </Button>} */}
                                        </div>
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
                                        <div className="start_plan_button_section">
                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${30}ch`} />
                                                :
                                                <Button loading={loadingPage} disabled={planName === 'Starter'} size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>
                                                    {planName == 'Starter' ? 'selected' : 'select'}

                                                </Button>}

                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $2,000 in additional revenue per month!</li>
                                            </ul>
                                            {/* <div>Up to 10 abandoned carts per month</div> */}

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
                                        <div className="start_plan_button_section">
                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${30}ch`} />
                                                :
                                                <Button loading={loadingPage} disabled={planName === 'Pro'} size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>
                                                    {planName == 'Pro' ? 'selected' : 'select'}
                                                </Button>}

                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 49 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $10,000 in additional revenue per month!</li>
                                            </ul>
                                            {/* <div>Up to 49 sales recovery carts per month</div> */}

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
                                        <div className="start_plan_button_section">

                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${30}ch`} />
                                                :
                                                <Button disabled={planName === 'Advance'} size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>
                                                    {planName == 'Advance' ? 'selected' : 'select'}
                                                </Button>}
                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 100 sales recovery carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $100000 more revenue per month</li>
                                            </ul>
                                            {/* <div>Up to 100 abandoned carts per month</div> */}

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
};

export default Settings;
