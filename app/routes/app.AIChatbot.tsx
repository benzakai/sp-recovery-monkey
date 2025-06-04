import { Badge, Page, Text } from '@shopify/polaris';
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { useOutletContext } from 'react-router';
import { isProPlanOrHigher } from '~/utils/plans';
import { useTranslation } from 'react-i18next';
import ChatbotSettingsSection from '~/components/AIChatbotSettings/ChatbotSettingsSection';


const AIChatbot = () => {
    const { t } = useTranslation()
    const [isSettingsLoading, setSettingsLoading] = useState(true);
    const [aiSettings, setAISettings] = useState({
        isWhatsappAssistantTurnedOn: true,
        toneOfVoice: "Friendly – Warm, casual, and easygoing",
        isUseEmojisTurnedOn: true,
        // trainingTopics: [
        //     'Products – Details, availability, and variations'
        // ],
        syncRequest: null
    });
    const [loading, setLoading]: any = useState({
        activeButton: null,
        syncing: false,
    })
    const { selectedPlanName, permissions }: any = useOutletContext()
    const activateButtons: { [key: string]: keyof typeof aiSettings } = {
        whatsappAssistantTurnedOnButton: 'isWhatsappAssistantTurnedOn',
        useEmojisTurnedOnButton: 'isUseEmojisTurnedOn',
    };
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
        }
    };

    const getFireData = async () => {
        const settingsData = await fetchAISettings()
        console.log("settingsData", settingsData);
        if (settingsData) {
            setAISettings(prevSettings => ({
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
        // trainingTopics,
        syncRequest = null
    }: any) => {
        try {
            const settingsData = {
                isWhatsappAssistantTurnedOn,
                toneOfVoice,
                isUseEmojisTurnedOn,
                // trainingTopics,
                syncRequest
            };
            console.log('settingsData of AI Chatbot.................>', settingsData)
            const response = await fetch('/api/saveAIChatbotSettings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settingsData),
            })

            const responsedata = await response.json();
            if (responsedata.success) {
                const topicNames = ["AIChatbotSettings"]
                sendPubSubData(settingsData, topicNames)
                shopify.toast.show("AI Chatbot Settings saved successfully")
                return { success: true }
            } else {
                shopify.toast.show("AI Chatbot Settings failed to save")
                return { success: false };
            }
        } catch (error) {
            console.log("error occured on handleSaveSettings of AI Chatbot", error)
        }
    }

    const handleSyncing = async () => {
        setLoading((p: any) => ({ ...p, syncing: true }))
        const topicNames = ["AIChatbotSyncingStart"]
        const data = {
            startScyningClicked: true
        }
        await handleSaveSettings({ ...aiSettings, syncRequest: "requested" });
        await sendPubSubData(data, topicNames)
        setLoading((p: any) => ({ ...p, syncing: false }))
        shopify.toast.show("Syncing has been started successfully")
    }

    const handleActivateButton = async (buttonType: string) => {
        const settingKey = activateButtons[buttonType];
        setAISettings((p: any) => ({ ...p, [settingKey]: !aiSettings[settingKey] }))
        if (settingKey) {
            setLoading((p: any) => ({ ...p, activeButton: buttonType }))
            const { success }: any = await handleSaveSettings({ ...aiSettings, [settingKey]: !aiSettings[settingKey] });
            if (success) {
                getFireData()
            }
            setLoading((p: any) => ({ ...p, activeButton: null }))
        }
    };

    return (
        <div className='start_page smart-bulk padding_zero'>
            <Page fullWidth>
                <div className='mb-16 bulk-box'>
                    <div className="mb-8">
                        <div className='flex flex-row gap-3'>
                            <Text variant="heading3xl" as="h3">
                                AI Personal Assistant 
                            </Text>
                            <div className='pt-3.5'>
                                <Badge tone='info' >Pro</Badge>
                            </div>
                        </div>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingXl" as="h3">
                                Customize your AI chatbot assistant 
                            </Text>
                        </div>
                        <div className='mb-14'></div>
                        <ChatbotSettingsSection
                            t={t}
                            isSettingsLoading={isSettingsLoading}
                            aiSettings={aiSettings}
                            setAISettings={setAISettings}
                            handleSaveSettings={handleSaveSettings}
                            handleSyncing={handleSyncing}
                            loading={loading}
                            topics={topics}
                            handleActivateButton={handleActivateButton}
                            isProPlanOrHigher={isProPlanOrHigher}
                            selectedPlanName={selectedPlanName}
                            permissions={permissions}
                        />
                    </div>
                </div>
            </Page>

        </div>
    );
};


export default AIChatbot;
