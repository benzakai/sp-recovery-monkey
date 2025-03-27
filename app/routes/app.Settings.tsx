import { Badge, BlockStack, Button, Card, Icon, InlineStack, Page, Select, SkeletonBodyText, SkeletonDisplayText, Spinner, Text } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN, STARTER_PLAN, PRO_PLAN, ADVANCE_PLAN } from "../shopify.server";
import { useActionData, useOutletContext } from 'react-router';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import MultiselectTagCombobox from '~/components/MultiselectTagCombobox';
import { isProPlanOrHigher } from '~/utils/plans';
import {
    LanguageFilledIcon
} from '@shopify/polaris-icons';
import db from '../db.server';
import { useTranslation } from 'react-i18next';


export const action = async ({ request }: any) => {
    const formData = await request.formData();
    const { billing, session } = await authenticate.admin(request);
    const actionType = formData.get("actionType");
    const selectedAppLanugage = formData.get("selectedAppLanugage");
    const planName = formData.get("planName") || MONTHLY_PLAN;
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
    // const [isLoadingPlanButton, setLoadingPlanButton] = useState(false)
    const submit = useSubmit();
    const [loadingPage, setLoadingPage] = useState(true)
    const loaderData: any = useLoaderData()
    const actionData: any = useActionData()
    const [isSettingsLoading, setSettingsLoading] = useState(true);
    const [settings, setSettings] = useState({
        durationToSendMessage: "After 24 hours",
        notificationStatus: true,
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
    });
    const [loading, setLoading]: any = useState({
        saveButton: false,
        saveMessageButton: false,
        activeButton: null
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
                // setLoadingPlanButton(false)
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
        // if (planName === "Free") setLoadingPlanButton(true)
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

    const options = [
        { label: t("settings.durationLable10Min"), value: 'After 10 min' },
        { label: t("settings.durationLable15Min"), value: 'After 15 min' },
        { label: t("settings.durationLable20Min"), value: 'After 20 min' },
        { label: t("settings.durationLable25Min"), value: 'After 25 min' },
        { label: t("settings.durationLable30Min"), value: 'After 30 min' },
    ];

    const followUpMessageDuration = [
        { label: t("settings.messageDurationLable24Hours"), value: 'After 24 hours' },
        { label: t("settings.messageDurationLable48Hours"), value: 'After 48 hours' }
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
        isSelectedLanguageActivated }: any) => {
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
            };
            // console.log('settingsData.................>', settingsData)
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
                    <div className='setting-block'>
                        <div className='settings_secion-1 w-4/5'>
                            <div className='start_main_container_sub_heading'>
                                <Text variant="headingXl" as="h3">
                                    {t('settings.general')}
                                </Text>
                            </div>
                            <BlockStack gap="400">
                                <Card roundedAbove="sm">
                                    {isSettingsLoading ? (
                                        <SkeletonLoading />
                                    ) : (
                                        <SettingsSecondBlock
                                            children={
                                                <div className="w-1/3 field">
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
                                            }
                                            title={t("settings.scheduleMessages")}
                                            description={t("settings.scheduleMessagesDescription")}
                                            activateButtonTitle={settings.isDurationToSendMessageActivated ? t("settings.deactivate") : t("settings.activate")}
                                            isActivateButtonLoading={loading.activeButton === "durationToSendMessageActivateButton"}
                                            isActivateButtonDisabled={loading.activeButton}
                                            handleActivateButton={handleActivateButton}
                                            buttonType={"durationToSendMessageActivateButton"}
                                            isActivated={settings.isDurationToSendMessageActivated}
                                        />
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
                                                            setLoading((p) => ({ ...p, saveButton: true }))
                                                            await handleSaveSettings({ ...settings, notificationStatus: !settings.notificationStatus })
                                                            setSettings({ ...settings, notificationStatus: !settings.notificationStatus })
                                                            setLoading((p) => ({ ...p, saveButton: true }))
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
                                <Card roundedAbove="sm">
                                    {isSettingsLoading ? (
                                        <SkeletonLoading
                                            secondLines={4}
                                        />
                                    ) : (
                                        <SettingsSecondBlock
                                            children={
                                                <div className="w-3/4">
                                                    <MultiselectTagCombobox
                                                        placeholder={t("settings.multiLanguageFieldPlaceholder")}
                                                        data={languages}
                                                        selectedTags={settings.preferredLanguages}
                                                        setSelectedTags={(v: any) => {
                                                            if (v?.length === 0) return shopify.toast.show(t("global.toastMessage.multiLanguageFieldWarning"))
                                                            setSettings({ ...settings, preferredLanguages: v })
                                                            handleSaveSettings({ ...settings, preferredLanguages: v })
                                                        }}
                                                        value={languageSearchValue}
                                                        setValue={setLanguageSearchValue}
                                                        isDisabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                                    />
                                                </div>
                                            }
                                            title={t("settings.multiLanguageTitle")}
                                            description={t("settings.multiLanguageDescription")}
                                            availableOn={"Pro"}
                                            activateButtonTitle={settings.isSelectedLanguageActivated ? t("settings.deactivate") : t("settings.activate")}
                                            isActivateButtonLoading={loading.activeButton === "languageSelectActivateButton"}
                                            isActivateButtonDisabled={loading.activeButton}
                                            handleActivateButton={handleActivateButton}
                                            buttonType={"languageSelectActivateButton"}
                                            isActivated={settings.isSelectedLanguageActivated}
                                        />
                                    )}
                                </Card>
                                <Card roundedAbove="sm">
                                    {isSettingsLoading ? (
                                        <SkeletonLoading
                                            secondClass='w-4/5 mt-8 mb-4'
                                            secondLines={14}
                                        />
                                    ) : (
                                        <SettingsSecondBlock
                                            children={
                                                <div className="w-4/5">
                                                    <Card>
                                                        {isMessageLoading ? <div className='flex justify-center items-center h-72'>
                                                            <Spinner accessibilityLabel="Small spinner example" size="large" />
                                                        </div> : <div className="flex-col" >
                                                            <textarea
                                                                className="w-full h-7 border-none outline-none text-base"
                                                                value={settings?.followUpMessage?.header}
                                                                onChange={(e) => {
                                                                    setSettings((prev) => ({
                                                                        ...prev,
                                                                        followUpMessage: {
                                                                            ...prev.followUpMessage,
                                                                            header: e.target.value
                                                                        }
                                                                    }))
                                                                }
                                                                }
                                                                placeholder={t("settings.messageBoxHeadingPlaceholder")}
                                                                disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                                            />
                                                            <textarea
                                                                className="w-full h-40 text-base border-none outline-none"
                                                                value={settings?.followUpMessage?.content}
                                                                onChange={(e) => {
                                                                    setSettings((prev) => ({
                                                                        ...prev,
                                                                        followUpMessage: {
                                                                            ...prev.followUpMessage,
                                                                            content: e.target.value
                                                                        }
                                                                    }))
                                                                }}
                                                                placeholder={t("settings.messageBoxContentPlaceholder")}
                                                                disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                                            />
                                                            <div className='flex justify-end pr-3 pt-4'>
                                                                <Button
                                                                    onClick={async () => {
                                                                        setLoading((p: any) => ({ ...p, saveMessageButton: true }))
                                                                        await handleSaveSettings(settings)
                                                                        setLoading((p: any) => ({ ...p, saveMessageButton: false }))
                                                                    }}
                                                                    variant="primary"
                                                                    disabled={messageToCompare?.header === settings?.followUpMessage?.header && messageToCompare?.content === settings?.followUpMessage?.content}
                                                                    loading={loading.saveMessageButton}
                                                                >{t("settings.messageBoxSaveButton")}</Button>
                                                            </div>
                                                        </div>}
                                                    </Card>
                                                </div>
                                            }
                                            title={t("settings.messageBoxTitle")}
                                            description={t("settings.messageBoxDescription")}
                                            availableOn={"Pro"}
                                            activateButtonTitle={settings.isDurationToSendFollowUpMessageActivated ? t("settings.deactivate") : t("settings.activate")}
                                            isActivateButtonLoading={loading.activeButton === "followUpMessageActivateButton"}
                                            isActivateButtonDisabled={loading.activeButton}
                                            handleActivateButton={handleActivateButton}
                                            buttonType={"followUpMessageActivateButton"}
                                            isActivated={settings.isDurationToSendFollowUpMessageActivated}
                                        />
                                    )}
                                    {isSettingsLoading ? (
                                        <SkeletonLoading />
                                    ) : (
                                        <SettingsSecondBlock
                                            children={
                                                <div className="w-1/3">
                                                    <Select
                                                        options={followUpMessageDuration}
                                                        label=""
                                                        onChange={(v) => {
                                                            setSettings({ ...settings, durationToSendFollowUpMessage: v })
                                                            handleSaveSettings({ ...settings, durationToSendFollowUpMessage: v })
                                                        }}
                                                        value={settings.durationToSendFollowUpMessage}
                                                    />
                                                </div>
                                            }
                                            title={""}
                                            description={t("settings.messageBoxDurationDescription")}
                                        />
                                    )}

                                </Card>
                            </BlockStack>
                        </div>
                    </div>

                    <div className='mb-20'></div>
                    <div className='settings_secion-2'>
                        <div className='start_main_container_sub_heading' style={{ marginBottom: "2px" }}>
                            <Text variant="headingXl" as="h3">
                                {t("settings.planSectionTitle")}
                            </Text>
                        </div>
                        <div className="start_price_container">
                            <div className="upgrade_page_container_heading">
                                {loadingPage ? <div className='w-56'><SkeletonBodyText lines={2} /> </div> :
                                    <div className='upgrade_page_container_heading_text'>{t("settings.planSectionDescription", { planName: t(`global.planNames.${planName}`) })}</div>}
                            </div>
                            <div className="start_price_container_cards">
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>{t("settings.planName1")}</div>
                                        <div className="start_plan_ammount_section" style={{ marginBottom: "145px" }}>
                                            <div className="start_plan_ammount">{t("settings.planPrice1")}</div>
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
                                                <li className='start_plan_list_item'>- {t("settings.freeBenefit1")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.freeBenefit2")}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>{t("settings.planName2")}</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">19$</div>
                                            <div className="start_plan_ammount_suffix">{t("settings.planPrice2")}</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge size="small" tone="info">{t("settings.freeTrileText")}</Badge> </div>
                                        <div className="start_plan_button_section">
                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                                :
                                                <Button loading={loadingPage} disabled={planName === 'Starter'} size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>
                                                    {planName == 'Starter' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}

                                                </Button>}

                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>- {t("settings.starterBenefit1")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.starterBenefit2")}</li>
                                            </ul>
                                            {/* <div>Up to 10 abandoned carts per month</div> */}

                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>{t("settings.planName3")}</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">49$</div>
                                            <div className="start_plan_ammount_suffix">{t("settings.planPrice3")}</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                                        <div className="start_plan_button_section">
                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                                :
                                                <Button loading={loadingPage} disabled={planName === 'Pro'} size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>
                                                    {planName == 'Pro' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}
                                                </Button>}

                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>- {t("settings.proBenefit1")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.proBenefit2")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.proBenefit3")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.proBenefit4")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.proBenefit5")}</li>
                                            </ul>
                                            {/* <div>Up to 49 sales recovery carts per month</div> */}

                                        </div>
                                    </div>
                                    <div className='popular_badge'>
                                        {t("settings.popularBadgeText")}
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>{t("settings.planName4")}</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">99$</div>
                                            <div className="start_plan_ammount_suffix">{t("settings.planPrice4")}</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                                        <div className="start_plan_button_section">

                                            {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                                :
                                                <Button disabled={planName === 'Advance'} size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>
                                                    {planName == 'Advance' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}
                                                </Button>}
                                        </div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>- {t("settings.advancedBenefit1")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.advancedBenefit2")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.advancedBenefit3")}</li>
                                                <li className='start_plan_list_item'>- {t("settings.advancedBenefit4")}</li>
                                            </ul>
                                            {/* <div>Up to 100 abandoned carts per month</div> */}

                                        </div>
                                    </div>

                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SkeletonLoading = ({ firstClass = "w-1/3 mt-1", secondClass = "w-1/2 mt-6 mb-4", firstLines = 1, secondLines = 3 }) => {
    return (<BlockStack gap="600">
        <BlockStack gap="400">
            <div className={firstClass}>
                <SkeletonBodyText lines={firstLines} />
            </div>
            <div className={secondClass}>
                <SkeletonBodyText lines={secondLines} />
            </div>
        </BlockStack>
    </BlockStack>)
}

const SettingsSecondBlock = ({
    children = <></>,
    title = 'Title',
    description = 'Setting Description',
    availableOn = '',
    toneType = "info",
    activateButtonTitle = "Activate",
    isActivated = false,
    isActivateButtonLoading = false,
    handleActivateButton,
    buttonType = '',
    isActivateButtonDisabled = false
}: any) => {
    return (
        <div className='p-4'>
            <BlockStack gap="600">
                <BlockStack gap="300">
                    <InlineStack direction="row" align="space-between">
                        {title && <Text as="p" variant="bodyLg" fontWeight="bold">
                            {title} <span className='pl-2'>{availableOn && <Badge tone={toneType} >{availableOn}</Badge>}</span>
                        </Text>}
                        {buttonType && <Button
                            disabled={isActivateButtonDisabled}
                            tone={isActivated ? 'critical' : 'success'}
                            loading={isActivateButtonLoading}
                            onClick={() => handleActivateButton(buttonType)}
                        >{activateButtonTitle}</Button>}
                    </InlineStack>
                    <Text as="p" variant="bodyLg">
                        {description}
                    </Text>
                    {children}
                </BlockStack>
            </BlockStack>
        </div>
    )
}

export default Settings;
