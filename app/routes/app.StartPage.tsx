import { Badge, Button, Card, Page, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';
import cartLogo from './images/cart.png';
import bagLogo from './images/bag.png';
import dollarLogo from './images/dollar.png';
import tickmarkLogo from './images/TickMark.png';



export const action = async ({ request }) => {
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;

    const { billing } = await authenticate.admin(request);

    const okay = await billing.require({
        plans: [planName],
        isTest: false,
        onFailure: async () => billing.request({
            plan: planName,
            isTest: false
        }),
    });

    return null;
};


const StartPage = () => {
    const [planName, setPlanName] = useState('not set');
    const [getData, setData] = useState([]);
    const submit = useSubmit();
    let sum = 0;
    let recoveredSum = 0;
    let count = 0;

    const handlePlanSelect = (planName) => {
        setPlanName(planName);
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };


    const AllOverValue = () => {
        getData?.forEach(function (item) {
            if (item.completed_at == null) {
                var num = parseFloat(item.total_price)
                sum += num;
                count++;
            }
        })
    };

    const recoveredCheckoutsTotalPrice = () => {
        getData?.forEach((item) => {
            if (item.completed_at) {
                recoveredSum += parseFloat(item.total_price);
            }
        })
    };



    useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);

    AllOverValue();
    recoveredCheckoutsTotalPrice();

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div className='start_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                Let’s Start!
                            </Text>
                        </div>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingLg" as="h5">
                                Here’s a Dashboard of Your Lost Revenue
                            </Text>
                        </div>
                        <div>
                            <Card>
                                <div className='start_pricing_plans'>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={cartLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>{getData?.length > 0 ? count : '0'}</div>
                                        <div className='start_plan_content_heading'>Abandoned Carts</div>
                                        <div className='start_plan_content_sub_heading'>Customers waiting for you to complete their purchase</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={bagLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>${sum.toFixed(2)}</div>
                                        <div className='start_plan_content_heading'>Missed Revenue</div>
                                        <div className='start_plan_content_sub_heading'>The amount you could have earned from these carts</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={dollarLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>${recoveredSum.toFixed(2)}</div>
                                        <div className='start_plan_content_heading'>Recovered Revenue</div>
                                        <div className='start_plan_content_sub_heading'>When you make money with our help, it appears here</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={tickmarkLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>$0.0%</div>
                                        <div className='start_plan_content_heading'>ACR Rate</div>
                                        <div className='start_plan_content_sub_heading'>The amount of income waiting for recovery</div>
                                    </div>

                                </div>
                            </Card>
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
                                        <div className='start_plan_name'>Starter</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">19$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge size="small" tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='micro' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $1,000 in additional revenue per month!</li>
                                            </ul>
                                            
                                        </div>
                                        {/* <div className="start_plan_extra_dialogue">Potential to generate up to $1,000 in additional revenue per month!</div> */}
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
                                        <div className="start_plan_button_section"><Button size='micro' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 49 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $10,000 in additional revenue per month!</li>
                                            </ul>
                                            
                                        </div>
                                        {/* <div className="start_plan_extra_dialogue">Potential to generate up to $10,000 in additional revenue per month!</div> */}
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
                                        <div className="start_plan_button_section"><Button size='micro' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 100 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $100,000 in additional revenue per month!</li>
                                            </ul>
                                            
                                        </div>
                                        {/* <div className="start_plan_extra_dialogue">Potential to generate up to $100000 in additional revenue per month!</div> */}
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
            const response = await fetch("/api/abandoned-checkouts/get");
            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();
                setData(responseData?.data || []);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
};

export default StartPage;
