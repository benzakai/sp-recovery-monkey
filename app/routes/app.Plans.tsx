import { Card, Page } from '@shopify/polaris';
import React, { useState } from 'react';
import '../Plans.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';


export const action = async ({ request }: ActionFunctionArgs) => {
    console.log('action');

    const { billing } = await authenticate.admin(request);
    const okay = await billing.require({
      plans: [MONTHLY_PLAN],
      isTest: true,
      onFailure: async () => billing.request({ 
        plan: MONTHLY_PLAN,
        isTest: true 
      }),
    });

    console.log("okay" ,okay);

    return null;
};

const Plans = () => {
    const [planName, setPlanName] = useState('not set');
    const submit = useSubmit();

    const handlePlanSelect = () => {
        // const formData = new FormData();
        // setPlanName(plan);
        submit(
            { myKey: "myValue" },
            { method: "POST", encType: "application/json" }
        );
    };

    return (
        <Page>
            <Card>
                <div className='plan_container'>
                    <div className='plan_heading_section'>
                        <div className='heading_plan'>Settings</div>
                        <div className='sub_heading_plan'>Your Current Plan is {planName}</div>
                    </div>
                    <div className="plan_pricings_section">
                        <div className='sub_heading_plan'>Choose the right plan for your needs</div>
                        <div className='pricing_plans'>
                            <div
                                className='pricing_plans_card'
                                onClick={() => handlePlanSelect('Starter',19)}
                            >
                                <div className='plan_content'>Starter</div>
                                <div className='plan_content'>$19/month</div>
                                <div className='plan_content'>Up to 10 abandoned carts per month</div>
                            </div>
                            <div
                                className='pricing_plans_card'
                                onClick={() => handlePlanSelect('Pro',49)}
                            >
                                <div className='plan_content'>Pro</div>
                                <div className='plan_content'>$49/month</div>
                                <div className='plan_content'>Up to 49 abandoned carts per month</div>
                            </div>
                            <div
                                className='pricing_plans_card'
                                onClick={() => handlePlanSelect('Advance',99)}
                            >
                                <div className='plan_content'>Advance</div>
                                <div className='plan_content'>$99/month</div>
                                <div className='plan_content'>Up to 100 abandoned carts per month</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Page>
    );
};

export default Plans;
