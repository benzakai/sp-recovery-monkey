import { Card, Page, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../Plans.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';


export const action = async ({ request }) => {
    console.log('action');
    const formData = await request.formData();
    const price = parseFloat(formData.get("price"));
    const planName = formData.get("planName") || MONTHLY_PLAN;
    console.log('price', price, planName);


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


const StartPage = () => {
    const [planName, setPlanName] = useState('not set');
    const submit = useSubmit();

    const handlePlanSelect = (planName, price) => {
        setPlanName(planName);
        const formData = new FormData();
        formData.append("planName", planName);
        formData.append("price", price);

        submit(formData, { method: "post" });
    };




    return (
        <Page>
            <div className='start_main_container'>
                <div>
                    <Text variant="heading3xl" as="h3">
                        Let’s Start!
                    </Text>
                </div>
                <div>
                    <Text variant="headingMd" as="h6">
                    Here’s a Dashboard of Your Lost Revenue
                    </Text>
                </div>
                <div>
                    <Card>
                    <div className='start_pricing_plans'>
                            <div
                                className='start_pricing_plans_card'
                                onClick={() => handlePlanSelect('Starter',19)}
                            >
                                <div className='start_plan_content_logo'>ff</div>
                                <div className='start_plan_content_value'>15</div>
                                <div className='start_plan_content_heading'>Abandoned Carts</div>
                                <div className='start_plan_content_sub_heading'>Customers waiting for you to complete their purchase</div>
                            </div>
                            
                        </div>
                    </Card>
                </div>
            </div>

        </Page>
    );
};

export default StartPage;
