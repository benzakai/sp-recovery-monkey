import { Badge, Button, Card, Page, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';


export const action = async ({ request }) => {
    console.log('action');
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;
    console.log('plan: ', planName);


    const { billing } = await authenticate.admin(request);

    const okay = await billing.require({
        plans: [planName],
        isTest: false,
        onFailure: async () => billing.request({
            plan: planName,
            isTest: false
        }),
    });



    console.log("Billing setup:", okay);

    return null;
};


const Settings = () => {
    const [planName, setPlanName] = useState('not set');
    const submit = useSubmit();

    const handlePlanSelect = (planName) => {
        // setPlanName(planName);
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
            console.log('plans data', Responsedata.data);
            return Responsedata.data;
        } else {
            return null;
        }
    };

    useEffect(() => {
        const getFireData = async () => {
            const fireStoreData = await getDataFromFirestore();
            if (Object.keys(fireStoreData).length === 0) {
                console.log('INACTIVE');

                setPlanName('NO_PLAN');
            } else {
                // console.log('ACTIVE');
                setPlanName(fireStoreData?.plan);
            }

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
                                <div className='upgrade_page_container_heading_text'>Your Current Plan is {planName}</div>
                            </div>
                            <div className="start_price_container_cards">
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Starter</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">19$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge size="small" tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section">
                                            <Button disabled={planName === 'Starter'} size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>
                                                {planName == 'Starter' ? 'selected' : 'select'}

                                            </Button>
                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            {/* <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 abandoned carts per month</li>
                                            </ul> */}
                                            <div>Up to 10 abandoned carts per month</div>

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
                                            <Button disabled={planName === 'Pro'} size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>
                                                {planName == 'Pro' ? 'selected' : 'select'}
                                            </Button>
                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            {/* <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 abandoned carts per month</li>
                                            </ul> */}
                                            <div>Up to 49 abandoned carts per month</div>

                                        </div>
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
                                            <Button disabled={planName === 'Advance'} size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>
                                                {planName == 'Advance' ? 'selected' : 'select'}
                                            </Button>
                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            {/* <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 abandoned carts per month</li>
                                            </ul> */}
                                            <div>Up to 100 abandoned carts per month</div>

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
