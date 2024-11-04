import { Card, Page } from '@shopify/polaris';
import React, { useState } from 'react';
import '../Plans.css';

const Plans = () => {
    const [planName, setPlanName] = useState('not set');

    const handlePlanSelect = (plan) => {
        setPlanName(plan);
        console.log(`Selected Plan: ${plan}`);
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
                                onClick={() => handlePlanSelect('Starter')}
                            >
                                <div className='plan_content'>Starter</div>
                                <div className='plan_content'>$19/month</div>
                                <div className='plan_content'>Up to 10 abandoned carts per month</div>
                            </div>
                            <div
                                className='pricing_plans_card'
                                onClick={() => handlePlanSelect('Pro')}
                            >
                                <div className='plan_content'>Pro</div>
                                <div className='plan_content'>$49/month</div>
                                <div className='plan_content'>Up to 49 abandoned carts per month</div>
                            </div>
                            <div
                                className='pricing_plans_card'
                                onClick={() => handlePlanSelect('Advance')}
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
