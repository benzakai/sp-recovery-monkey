import { Icon, Select, Text } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { authenticate, STARTER_PLAN, PRO_PLAN, ADVANCE_PLAN, ADVANCE_PLAN_YEARLY, PRO_PLAN_YEARLY, STARTER_PLAN_YEARLY } from "../shopify.server";
import { useActionData, useOutletContext } from 'react-router';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import { isProPlanOrHigher } from '~/utils/plans';
import {
    LanguageFilledIcon
} from '@shopify/polaris-icons';
import db from '../db.server';
import { useTranslation } from 'react-i18next';
import PlanSection from '~/components/Settings/PlanSection';
import SettingsSection from '~/components/Settings/SettingsSection';


export const action = async ({ request }: any) => {
    const formData = await request.formData();
    const { billing, session } = await authenticate.admin(request);
    const actionType = formData.get("actionType");
    const selectedAppLanugage = formData.get("selectedAppLanugage");
    const planName = formData.get("planName");
    let savedLanguage;
    if (actionType === "languageChange") {
        const existingLanguage = await db.appLanguages.findUnique({
            where: {
                shop: session.shop,
            },
        });
        if (existingLanguage) {
            savedLanguage = await db.appLanguages.update({
                where: {
                    shop: session.shop,
                },
                data: {
                    language: selectedAppLanugage,
                },
            });
        } else {
            savedLanguage = await db.appLanguages.create({
                data: {
                    language: selectedAppLanugage,
                    shop: session.shop,
                },
            });
        }
    } else if (actionType === "planChange") {
        if (planName === "Free") {
            const { hasActivePayment, appSubscriptions } = await billing.check({
                plans: [STARTER_PLAN, PRO_PLAN, ADVANCE_PLAN, STARTER_PLAN_YEARLY, PRO_PLAN_YEARLY, ADVANCE_PLAN_YEARLY],
                isTest: session.shop === "sprecoverymonkey.myshopify.com" ? true : false,
            });
            const subscription = appSubscriptions?.[0];
            const cancelledSubscription = await billing.cancel({
                subscriptionId: subscription.id,
                isTest: session.shop === "sprecoverymonkey.myshopify.com" ? true : false,
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
                isTest: session.shop === "sprecoverymonkey.myshopify.com" ? true : false,
                trialDays: 0,
                onFailure: async () => billing.request({
                    plan: planName,
                    isTest: session.shop === "sprecoverymonkey.myshopify.com" ? true : false,
                    trialDays: 0
                }),
            });
        }
    }

    return { success: true, planName, savedAppLangnuage: savedLanguage?.language };
};

export const loader = async ({ request }: any) => {
    const { session } = await authenticate.admin(request);
    const languageData = await db.appLanguages.findUnique({
        where: {
            shop: session.shop
        }
    })
    return { userSelectedLanguage: languageData?.language || "en" };
}

const languages = ['English', 'Español', 'العربية', 'Português', 'Deutsch', 'Français', 'Italiano']

const Settings = () => {
    const { i18n, t } = useTranslation()
    const [planName, setPlanName] = useState('not set');
    const [isLoadingPlanButton, setLoadingPlanButton] = useState(null)
    const submit = useSubmit();
    const [loadingPage, setLoadingPage] = useState(true)
    const loaderData: any = useLoaderData()
    const actionData: any = useActionData()
    const [isSettingsLoading, setSettingsLoading] = useState(true);
    const [settings, setSettings] = useState({
        durationToSendMessage: "After 24 hours",
        notificationStatus: new Boolean(true).toString(),
        preferredLanguages: ['English'],
        followUpMessage: {
            header: t("settings.messageHeadingText"),
            content: t("settings.messageContentText")
        },
        durationToSendFollowUpMessage: "After 10 min",
        selectedLanguage: "en",
        isDurationToSendMessageActivated: true,
        isSelectedLanguageActivated: false,
        isDurationToSendFollowUpMessageActivated: false
        // judgeme: "no"
    });
    const [loading, setLoading]: any = useState({
        saveButton: false,
        saveMessageButton: false,
        activeButton: null
        // judgemeButtonLoading: false
    })
    const [languageSearchValue, setLanguageSearchValue] = useState('');
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [messageToCompare, setMessageToCompare] = useState("")
    const { selectedPlanName, permissions }: any = useOutletContext()
    const activateButtons: { [key: string]: keyof typeof settings } = {
        followUpMessageActivateButton: 'isDurationToSendFollowUpMessageActivated',
        durationToSendMessageActivateButton: 'isDurationToSendMessageActivated',
        languageSelectActivateButton: 'isSelectedLanguageActivated',
    };

    useEffect(() => {
        if (actionData?.success) {
            if (actionData?.planName === "Free") {
                setLoadingPlanButton(null)
                setPlanName(actionData?.planName)
            } else if (actionData?.savedAppLangnuage) {
                i18n.changeLanguage(actionData?.savedAppLangnuage)
                handleSaveSettings({ ...settings })
                // shopify.toast.show(t("global.toastMessage.languageChangeSuccess"))
            }
        }
    }, [actionData])

    useEffect(() => {
        if (loaderData) {
            setSettings((p: any) => ({ ...p, selectedLanguage: loaderData.userSelectedLanguage }))
        }
    }, [loaderData])

    const handlePlanSelect = (planName: any) => {
        setLoadingPlanButton(planName)
        const formData = new FormData();
        formData.append("planName", planName);
        formData.append("actionType", "planChange");
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
            // console.log("responsedata", responsedata);

            if (Object.keys(responsedata.data).length) {
                return responsedata.data;
            } else {
                const responseSave: any = await fetch('/api/saveSettings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        durationToSendMessage: "After 10 min",
                        notificationStatus: new Boolean(true).toString(),
                        followUpMessage: {
                            header: "Hi [Customer’s Name]",
                            content: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]"
                        },
                        preferredLanguages: ['English'],
                        durationToSendFollowUpMessage: 'After 24 hours',
                        selectedLanguage: "en",
                        isDurationToSendMessageActivated: true,
                        isSelectedLanguageActivated: false,
                        isDurationToSendFollowUpMessageActivated: false
                        // judgeme: false
                    }),
                });
                const responseSaveData = await responseSave.json();
                // console.log("responseSaveData", responseSaveData);
                return responseSaveData.data
            }
        } catch (error) {
            console.log("error on fetchSettings", error);
        } finally {
            setSettingsLoading(false)
            setMessageLoading(false)
        }
    };



    const getFireData = async () => {
        const subscriptionData = await getSubscriptionData();
        const settingsData = await fetchSettings()
        console.log("settingsData", settingsData);
        if (settingsData) {
            setSettings(prevSettings => ({
                ...prevSettings,
                ...settingsData,
                selectedLanguage: prevSettings?.selectedLanguage,
                followUpMessage: {
                    ...prevSettings.followUpMessage,
                    ...settingsData?.followUpMessage,
                }
            }));
            setMessageToCompare(settingsData?.followUpMessage)
        }
        if (Object.keys(subscriptionData).length === 0) {
            setPlanName('NO_PLAN');
        } else {
            setPlanName(subscriptionData?.plan);
        }
        setLoadingPage(false)
    }
    useEffect(() => {
        getFireData();
    }, []);

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

    const handleSaveSettings = async ({
        durationToSendMessage,
        notificationStatus,
        followUpMessage,
        durationToSendFollowUpMessage,
        preferredLanguages,
        isDurationToSendFollowUpMessageActivated,
        isDurationToSendMessageActivated,
        isSelectedLanguageActivated
        // judgeme 
    }: any) => {
        try {
            const settingsData = {
                durationToSendMessage,
                notificationStatus: new Boolean(notificationStatus).toString(),
                followUpMessage: followUpMessage || "",
                durationToSendFollowUpMessage,
                preferredLanguages: preferredLanguages || [],
                selectedLanguage: settings.selectedLanguage,
                isDurationToSendFollowUpMessageActivated,
                isDurationToSendMessageActivated,
                isSelectedLanguageActivated
                // judgeme
            };
            console.log('settingsData.................>', settingsData)
            const response = await fetch('/api/saveSettings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsData),
            })

            const responsedata = await response.json();
            if (responsedata.success) {
                setMessageToCompare(settingsData.followUpMessage)
                sendPubSubData(settingsData)
                shopify.toast.show(t("global.toastMessage.successSettingsSaved"))
                return { success: true }
            } else {
                shopify.toast.show(t("global.toastMessage.faliedSettingsSaved"))
            }
        } catch (error) {
            console.log("error occured on handleSaveSettings", error)
        }
    }

    const languageOptions = [
        {
            label: 'English',
            value: 'en',
            prefix: <Icon source={LanguageFilledIcon} />,
        },
        {
            label: 'Español',
            value: 'es',
            prefix: <Icon source={LanguageFilledIcon} />,
        },
        {
            label: 'Português',
            value: 'pt',
            prefix: <Icon source={LanguageFilledIcon} />,
        },
        {
            label: 'Français',
            value: 'fr',
            prefix: <Icon source={LanguageFilledIcon} />,
        },
        {
            label: 'Deutsch',
            value: 'de',
            prefix: <Icon source={LanguageFilledIcon} />,
        }
    ];

    const handleLanguageChange = (value: any) => {
        setSettings((p: any) => ({ ...p, selectedLanguage: value }))
        const formData = new FormData()
        formData.append("selectedAppLanugage", value);
        formData.append("actionType", "languageChange");
        submit(formData, { method: "post" });
    }

    const handleActivateButton = async (buttonType: string) => {
        const settingKey = activateButtons[buttonType];
        setSettings((p: any) => ({ ...p, [settingKey]: !settings[settingKey] }))
        if (settingKey) {
            setLoading((p: any) => ({ ...p, activeButton: buttonType }))
            const { success }: any = await handleSaveSettings({ ...settings, [settingKey]: !settings[settingKey] });
            if (success) {
                getFireData()
            }
            // shopify.toast.show(t("global.toastMessage.settingsActivateButtonStatus", { status: !settings[settingKey] ? t("settings.activated") : t("settings.deactivated") }))
            setLoading((p: any) => ({ ...p, activeButton: null }))
        }
    };

    return (
        <div className="body">
            <div className='start_page'>
                <div className='start_main_container'>
                    <div className='flex flex-row justify-between'>
                        <div className='start_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                {t('settings.title')}
                            </Text>
                        </div>
                        <Select
                            label=""
                            options={languageOptions}
                            onChange={handleLanguageChange}
                            value={settings.selectedLanguage}
                        />
                    </div>
                    <div className='start_main_container_sub_heading'>
                        <Text variant="headingXl" as="h3">
                            {t('settings.subtitle')}
                        </Text>
                    </div>
                    <div className='mb-14'></div>
                    <SettingsSection
                        t={t}
                        isSettingsLoading={isSettingsLoading}
                        settings={settings}
                        setSettings={setSettings}
                        handleSaveSettings={handleSaveSettings}
                        loading={loading}
                        handleActivateButton={handleActivateButton}
                        languages={languages}
                        setLanguageSearchValue={setLanguageSearchValue}
                        languageSearchValue={languageSearchValue}
                        isProPlanOrHigher={isProPlanOrHigher}
                        selectedPlanName={selectedPlanName}
                        permissions={permissions}
                        isMessageLoading={isMessageLoading}
                        setLoading={setLoading}
                        messageToCompare={messageToCompare}
                    />
                    <div className='mb-20'></div>
                    <PlanSection
                        t={t}
                        loadingPage={loadingPage}
                        loadingButton={isLoadingPlanButton}
                        planName={planName}
                        handlePlanSelect={handlePlanSelect}
                        pageType={"settings"}
                    />
                </div>
            </div>
        </div>
    );
};


export default Settings;
