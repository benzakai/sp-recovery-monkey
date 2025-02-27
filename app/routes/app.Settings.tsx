import { Badge, BlockStack, Button, Card, InlineGrid, Page, Select, SkeletonBodyText, SkeletonDisplayText, Spinner, Text, TextField } from '@shopify/polaris';
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
    const [isSettingsLoading, setSettingsLoading] = useState(true);
    const [settings, setSettings] = useState({
        durationToSendMessage: "After 10 min",
        notificationStatus: true,
    });
    const [isSaveButtonLoading, setSaveButtonLoading] = useState(false);

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

    const getSubscriptionData = async () => {
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

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=settings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const responsedata = await response.json();
            console.log("responsedata", responsedata);

            if (Object.keys(responsedata.data).length) {
                return responsedata.data;
            } else {
                return null;
            }
        } catch (error) {
            console.log("error on fetchSettings", error);
        } finally {
            setSettingsLoading(false)
        }
    };



    useEffect(() => {
        const getFireData = async () => {
            const subscriptionData = await getSubscriptionData();
            const settingsData = await fetchSettings()
            console.log("settingsData", settingsData);

            settingsData && setSettings(settingsData);
            if (Object.keys(subscriptionData).length === 0) {
                setPlanName('NO_PLAN');
            } else {
                setPlanName(subscriptionData?.plan);
            }
            setLoadingPage(false)
        }
        getFireData();
    }, []);

    const options = [
        { label: 'After 10 min', value: 'After 10 min' },
        { label: 'After 15 min', value: 'After 15 min' },
        { label: 'After 20 min', value: 'After 20 min' },
        { label: 'After 25 min', value: 'After 25 min' },
        { label: 'After 30 min', value: 'After 30 min' },
    ];

    const sendPubSubData = async (data: any) => {
        const topicNames = ["settings"]
        const instanceResponse = await fetch('/api/getInstance');
        const instanceResponseData = await instanceResponse.json();
        const message = {
            settings: data,
            greenAPIId: instanceResponseData.instance.idInstance,
            storeId: instanceResponseData.instance.shop,
            greenAPIKey: instanceResponseData.instance?.apiTokenInstance,
            greenAPIUrl: instanceResponseData.instance.apiUrl,
        }
        // console.log("message on sendPubSubData of settingsSave", message);
        const pubSubRespone = await fetch('/api/sendPubSubData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, topicNames }),
        });
        const pubSubResponeData = await pubSubRespone.json();
        // console.log("pubSubResponeData", pubSubResponeData);
    };

    const handleSaveSettings = async (data: any) => {
        // console.log("data   ssssssssssssssss", { durationToSendMessage: data.durationToSendMessage })
        // console.log("data   dddddddddddddddddd", { ...data, notificationStatus: new Boolean(data.notificationStatus).toString() })
        const response = await fetch('/api/saveSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ durationToSendMessage: data.durationToSendMessage }),
        })

        const responsedata = await response.json();
        if (responsedata.success) {
            // const dataToSend = { ...data, notificationStatus: new Boolean(data.notificationStatus).toString() };
            // console.log("data", JSON.stringify(dataToSend));
            sendPubSubData({ durationToSendMessage: data.durationToSendMessage })
            shopify.toast.show("Settings saved successfully")
        } else {
            shopify.toast.show("Failed to save settings")
        }
    }

    return (

        <div className="body">
            {/* <div>

            </div> */}
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div className='start_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                Settings
                            </Text>
                        </div>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingXl" as="h3">
                                Manage messages and reminders to enhance customer experience
                            </Text>
                        </div>
                        <div className='mb-14'></div>
                        <div className='settings_secion-1 w-4/5'>
                            <div className='start_main_container_sub_heading'>
                                <Text variant="headingXl" as="h3">
                                    General
                                </Text>
                            </div>
                            <BlockStack gap="400">
                                <Card roundedAbove="sm">
                                    {isSettingsLoading ? (
                                        <div>
                                            <BlockStack gap="600">
                                                <BlockStack gap="400">
                                                    <div className="w-1/3 mt-1">
                                                        <SkeletonBodyText lines={1} />
                                                    </div>
                                                    <div className="w-1/2 mt-6 mb-4">
                                                        <SkeletonBodyText lines={2} />
                                                    </div>
                                                </BlockStack>
                                            </BlockStack>
                                        </div>
                                    ) : (
                                        <BlockStack gap="600">
                                            <BlockStack gap="300">
                                                <Text as="p" variant="bodyLg" fontWeight="bold">
                                                    Schedule Messages
                                                </Text>
                                                <Text as="p" variant="bodyLg">
                                                    Set the perfect time to send messages to your customers.
                                                </Text>
                                                <div className="w-1/3">
                                                    <Select
                                                        options={options}
                                                        label=""
                                                        onChange={(v) => {
                                                            setSettings({ ...settings, durationToSendMessage: v })
                                                            handleSaveSettings({ ...settings, durationToSendMessage: v })
                                                        }}
                                                        value={settings.durationToSendMessage}
                                                    />
                                                </div>
                                            </BlockStack>
                                        </BlockStack>
                                    )}
                                </Card>
                                {/* <Card roundedAbove="sm">
                                    {isSettingsLoading ? (
                                        <BlockStack gap="400">
                                            <BlockStack gap="200">
                                                <div className=" mb-6 mt-2">
                                                    <InlineGrid columns="1fr auto">
                                                        <SkeletonBodyText lines={1} />
                                                    </InlineGrid>
                                                </div>
                                                <div className="w-1/2 ">
                                                    <SkeletonBodyText lines={1} />
                                                </div>
                                            </BlockStack>
                                        </BlockStack>
                                    ) : (
                                        <BlockStack gap="400">
                                            <BlockStack gap="200">
                                                <InlineGrid columns="1fr auto">
                                                    <Text as="p" variant="bodyLg" fontWeight="bold">
                                                        Order Update Notifications
                                                        <span className="ml-4"></span><Badge tone={settings.notificationStatus ? "success" : "enabled"}>{settings.notificationStatus ? "Active" : "Deactive"}</Badge>
                                                    </Text>
                                                    <Button
                                                        loading={isSaveButtonLoading}
                                                        onClick={async () => {
                                                            setSaveButtonLoading(true)
                                                            await handleSaveSettings({ ...settings, notificationStatus: !settings.notificationStatus })
                                                            setSettings({ ...settings, notificationStatus: !settings.notificationStatus })
                                                            setSaveButtonLoading(false)
                                                        }}
                                                    >{settings.notificationStatus ? "Deactivate" : "Activate"}</Button>
                                                </InlineGrid>
                                                <Text as="p" variant="bodyLg">
                                                    Enable WhatsApp notifications to update customers on their order details.
                                                </Text>
                                            </BlockStack>
                                        </BlockStack>
                                    )}
                                </Card>*/}
                            </BlockStack>
                        </div>
                        <div className='mb-20'></div>
                        <div className='settings_secion-2'>
                            <div className='start_main_container_sub_heading' style={{ marginBottom: "2px" }}>
                                <Text variant="headingXl" as="h3">
                                    Choose the right plan for your needs
                                </Text>
                            </div>
                            <div className="start_price_container">
                                <div className="upgrade_page_container_heading">
                                    {loadingPage ? <div className='w-56'><SkeletonBodyText lines={2} /> </div> :
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
                    </div>

                </Page>
            </div>
        </div>
    );
};

export default Settings;
