import { Badge, Page, Text } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { isProPlanOrHigher } from '~/utils/plans';
import { useTranslation } from 'react-i18next';
import ChatbotSettingsSection from '~/components/AIChatbotSettings/ChatbotSettingsSection';
import { authenticate } from '~/shopify.server';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import SaveBarComponent from '~/components/SaveBarComponent';
import TopSaleBanner from '~/components/global/TopSaleBanner';
import { manageOnboarding } from '~/lib/onboarding/common';

export const loader = async ({ request }: any) => {
    try {
        const { session } = await authenticate.admin(request);
        const url = `https://${session.shop}/admin/api/2025-04/themes.json`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Shopify-Access-Token": session.accessToken,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch themes: ${response.statusText}`);
        }
        const data = await response.json();
        const mainTheme = data.themes.find((theme: any) => theme.role === "main");
        const themeEditorId = mainTheme?.id || null;
        const EXTENSTION_ID = process.env.SHOPIFY_CHAT_WIDGET_ID
        // console.log("themeEditorId", themeEditorId);
        return {
            shopName: session.shop.replace(/\.myshopify\.com$/, ''),
            themeEditorId,
            EXTENSTION_ID,
            shop: session.shop
        };
    } catch (error) {
        console.error("Error in AIChatbot loader:", error);
        throw new Response("Internal Server Error", { status: 500 });
    }
};

const AIChatbot = () => {
    const { t } = useTranslation()
    const { shopName, themeEditorId, EXTENSTION_ID, shop }: any = useLoaderData();
    const [isSettingsLoading, setSettingsLoading] = useState(true);
    const [aiSettings, setAISettings] = useState({
        isWhatsappAssistantTurnedOn: true,
        toneOfVoice: "Friendly – Warm, casual, and easygoing",
        isUseEmojisTurnedOn: true,
        iconStyle: 'style1',
        iconPosition: 'position2',
        // trainingTopics: [
        //     'Products – Details, availability, and variations'
        // ],
        syncRequest: null,
        lastSyncDate: ""
    });
    const [aiCompareSettings, setAICompareSettings] = useState(aiSettings);
    const [isSaveButtonLoading, setSaveButtonLoading] = useState<any>(null)
    const [loading, setLoading]: any = useState({
        activeButton: null,
        syncing: false,
    })
    const { selectedPlanName, permissions }: any = useOutletContext()
    const activateButtons: { [key: string]: keyof typeof aiSettings } = {
        whatsappAssistantTurnedOnButton: 'isWhatsappAssistantTurnedOn',
        useEmojisTurnedOnButton: 'isUseEmojisTurnedOn',
    };
    const [aiWidgetData, setAIWidgetData] = useState({
        loading: true,
        enabled: false
    });
    const [activateButtonActionType, setActivateButtonActionType] = useState<string | null>(null);
    const topics = [
        'All training topics',
        'Products – Details, availability, and variations',
        'Orders – Status, changes, and order history',
        'Shipping – Delivery times, tracking, and policies',
        'Returns & Refunds – Return policy and process',
        'Payments – Accepted methods, issues, and confirmations',
        'Promotions – Active discounts, coupon codes, and sales',
        'Store Hours & Locations – Opening times and branches',
        'FAQs – Common questions specific to your business'
    ]

    useEffect(() => {
        const hasChanges =
            aiSettings.toneOfVoice !== aiCompareSettings.toneOfVoice ||
            aiSettings.iconStyle !== aiCompareSettings.iconStyle ||
            aiSettings.iconPosition !== aiCompareSettings.iconPosition ||
            aiSettings.isWhatsappAssistantTurnedOn !== aiCompareSettings.isWhatsappAssistantTurnedOn ||
            aiSettings.isUseEmojisTurnedOn !== aiCompareSettings.isUseEmojisTurnedOn;
        if (hasChanges) {
            shopify.saveBar.show('ai-settings-save-bar');
        } else {
            shopify.saveBar.hide('ai-settings-save-bar');
        }
    }, [aiSettings, aiCompareSettings]);

    const fetchAISettings = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=AIChatbotSettings', {
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
                const responseSave: any = await fetch('/api/saveAIChatbotSettings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        isWhatsappAssistantTurnedOn: true,
                        toneOfVoice: "Friendly – Warm, casual, and easygoing",
                        isUseEmojisTurnedOn: true,
                        iconStyle: 'style1',
                        iconPosition: 'position2',
                        // trainingTopics: [
                        //     'Products – Details, availability, and variations'
                        // ],
                    }),
                });
                const responseSaveData = await responseSave.json();
                return responseSaveData.data
            }
        } catch (error) {
            console.log("error on fetchSettings", error);
        } finally {
            setSettingsLoading(false)
            checkEmbedDisabled()
        }
    };

    const checkEmbedDisabled = async () => {
        try {
            const response = await fetch('/api/getEmbedStatus');
            const res = await response.json();
            const resEmbedEnabled = !res.embedDisabled
            setAIWidgetData({
                loading: false,
                enabled: resEmbedEnabled
            });
        } catch (error) {
            console.log("error occured on checkEmbedDisabled", error);
        }
    }

    const getFireData = async () => {
        const settingsData = await fetchAISettings()
        // console.log("settingsData", settingsData);
        if (settingsData) {
            setAISettings(prevSettings => ({
                ...prevSettings,
                ...settingsData,
            }));
            setAICompareSettings(prevSettings => ({
                ...prevSettings,
                ...settingsData,
            }));
        }
    }

    useEffect(() => {
        getFireData();
    }, []);

    const sendPubSubData = async (data: any, topicNames: any) => {
        const instanceResponse = await fetch('/api/getInstance');
        const instanceResponseData = await instanceResponse.json();
        const message = {
            data: data,
            greenAPIId: instanceResponseData.instance.idInstance,
            storeId: instanceResponseData.instance.shop,
            greenAPIKey: instanceResponseData.instance?.apiTokenInstance,
            greenAPIUrl: instanceResponseData.instance.apiUrl,
        }
        // console.log("message", message);
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
        isWhatsappAssistantTurnedOn,
        toneOfVoice,
        isUseEmojisTurnedOn,
        iconStyle,
        iconPosition,
        // trainingTopics,
        syncRequest = null
    }: any) => {
        try {
            setSaveButtonLoading("doLoad")
            const settingsData = {
                isWhatsappAssistantTurnedOn,
                toneOfVoice,
                isUseEmojisTurnedOn,
                iconStyle,
                iconPosition,
                // trainingTopics,
                syncRequest
            };
            // console.log('settingsData of AI Chatbot.................>', settingsData)
            const response = await fetch('/api/saveAIChatbotSettings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsData),
            })

            const responsedata = await response.json();
            if (responsedata.success) {
                const toneJustChanged =
                    toneOfVoice !== aiCompareSettings.toneOfVoice;
                setAICompareSettings(aiSettings)
                const topicNames = ["AIChatbotSettings"]
                sendPubSubData(settingsData, topicNames)
                shopify.toast.show(t("global.toastMessage.aiChatbotSettingsSaved"));
                if (toneJustChanged) {
                    await manageOnboarding({
                        data: { step2: { chooseTone: true } },
                        shop,
                    });
                }
                return { success: true }
            } else {
                shopify.toast.show(t("global.toastMessage.aiChatbotSettingsFailed"))
                return { success: false };
            }
        } catch (error) {
            console.log("error occured on handleSaveSettings of AI Chatbot", error)
        } finally {
            fetchAISettings();
            setSaveButtonLoading(null);
        }
    }

    const handleSyncing = async () => {
        setLoading((p: any) => ({ ...p, syncing: true }))
        const topicNames = ["AIChatbotSyncingStart"]
        const data = {
            startScyningClicked: true
        }
        await handleSaveSettings({ ...aiSettings, syncRequest: "requested", lastSyncDate: "" });
        await sendPubSubData(data, topicNames)
        manageOnboarding({ data: { step2: { startSync: true } }, shop });
        setLoading((p: any) => ({ ...p, syncing: false }))
        shopify.toast.show(t("global.toastMessage.aiChatbotSyncingStarted"))
    }

    // const handleActivateButton = async (buttonType: string) => {
    //     const settingKey = activateButtons[buttonType];
    //     if (settingKey) {
    //         const { success }: any = await handleSaveSettings({ ...aiSettings, [settingKey]: !aiSettings[settingKey] });
    //         if (success) {
    //             getFireData()
    //         }
    //         setAICompareSettings((p: any) => ({ ...p, [settingKey]: !aiSettings[settingKey] }))
    //     }
    // };

    const handleChatExtensionActivateButton = async () => {
        if (!aiSettings.isWhatsappAssistantTurnedOn) {
            shopify.toast.show(t("global.toastMessage.turnOnWhatsAppAssistant"));
            return;
        }
        // console.log("shopName", shopName);
        // console.log("themeEditorId", themeEditorId);
        const EXTENSTION_FILE_NAME = "AI_chat_widget";
        const url = `https://admin.shopify.com/store/${shopName}/themes/${themeEditorId}/editor?context=apps&template=index&activateAppId=${EXTENSTION_ID}/${EXTENSTION_FILE_NAME}`;
        window.open(url, '_blank');
    };

    const handleDiscardChanges = () => {
        setAISettings(aiCompareSettings);
    }

    return (
        <div className='start_page ai_personal padding_zero'>
            <Page fullWidth>
                <div className='bulk-box top-parent-aichatbot'>
                    <TopSaleBanner
                        btnClass="saleBannerButton"
                        className='cursor-pointer'
                    />
                    <div className='flex flex-row gap-3 items-center mt-6 mb-4 cust_chatbot_title'>
                        <Text variant="headingLg" as="h5">
                            {t("aiSettings.title")}
                        </Text>
                        <div>
                            <Badge tone='info' >{t("settings.planName3")}</Badge>
                        </div>
                    </div>
                    <div>
                        <ChatbotSettingsSection
                            t={t}
                            handleChatExtensionActivateButton={handleChatExtensionActivateButton}
                            isSettingsLoading={isSettingsLoading}
                            aiSettings={aiSettings}
                            setAISettings={setAISettings}
                            activateButtons={activateButtons}
                            handleSyncing={handleSyncing}
                            loading={loading}
                            setActivateButtonActionType={setActivateButtonActionType}
                            isProPlanOrHigher={isProPlanOrHigher}
                            selectedPlanName={selectedPlanName}
                            permissions={permissions}
                            aiWidgetData={aiWidgetData}
                        />
                    </div>
                </div>
            </Page>
            <SaveBarComponent
                onSave={() => handleSaveSettings({ ...aiSettings })}
                isLoading={isSaveButtonLoading}
                onDiscard={handleDiscardChanges}
                saveText={t("settings.messageBoxSaveButton")}
                discardText={t("settings.discard")}
                variant="primary"
                id="ai-settings-save-bar"
            />
        </div>
    );
};


export default AIChatbot;
