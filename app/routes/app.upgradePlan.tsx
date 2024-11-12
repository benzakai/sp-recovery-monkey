import { Card, Page } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../Plans.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';


export const action = async ({ request }) => {
    console.log('action');
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;
    console.log('plan: ',planName);
    

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


const upgradePlan = () => {
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
        if(Responsedata.data){
           console.log('plans data',Responsedata.data);
           return Responsedata.data;
        }else{
          return null;
        }
    };

    useEffect(()=>{
        const getFireData = async()=>{
          const fireStoreData = await getDataFromFirestore();
          if(Object.keys(fireStoreData).length === 0){
            console.log('INACTIVE');
            
            setPlanName('NO_PLAN');
          }else{
            // console.log('ACTIVE');
            setPlanName(fireStoreData?.plan);
          }
          
        }
    
        getFireData();
    },[]);

    
    

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
                                className={planName == 'Starter' ? 'pricing_plans_card active_plan':'pricing_plans_card' }
                                onClick={() => handlePlanSelect('Starter')}
                            >
                                <div className='plan_content'>Starter</div>
                                <div className='plan_content'>$19/month</div>
                                <div className='plan_content'>Up to 10 abandoned carts per month</div>
                            </div>
                            <div
                                className={planName == 'Pro' ? 'pricing_plans_card active_plan':'pricing_plans_card' }
                                onClick={() => handlePlanSelect('Pro')}
                            >
                                <div className='plan_content'>Pro</div>
                                <div className='plan_content'>$49/month</div>
                                <div className='plan_content'>Up to 49 abandoned carts per month</div>
                            </div>
                            <div
                                className={planName == 'Advance' ? 'pricing_plans_card active_plan':'pricing_plans_card' }
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

export default upgradePlan;
