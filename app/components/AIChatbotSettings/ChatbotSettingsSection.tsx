import { BlockStack, Button, Card, Select, Spinner, Text } from '@shopify/polaris'
import SkeletonLoading from '../Settings/SkeletonLoading'
import SettingsSecondBlock from '../Settings/SettingsSecondBlock'
import MultiselectTagCombobox from '../MultiselectTagCombobox'
import { useState } from 'react';
import AlienSVG from '../SVGs/AlienSVG';
import ChatIconSettings from './ChatIconSettings';
import { isAdvancePlanOrHigher } from '~/utils/plans';

export default function ChatbotSettingsSection({
    t,
    isSettingsLoading,
    aiSettings,
    setAISettings,
    handleSyncing,
    loading,
    setActivateButtonActionType,
    isProPlanOrHigher,
    selectedPlanName,
    activateButtons,
    permissions,
    handleChatExtensionActivateButton,
    aiWidgetData
}: any) {
    const [topicSearchValue, setTopicSearchValue] = useState('');


    const options = [
        { label: "Friendly – Warm, casual, and easygoing", value: 'Friendly – Warm, casual, and easygoing' },
        { label: "Professional – Clear, concise, and business-like", value: 'Professional – Clear, concise, and business-like' },
        { label: "Playful – Fun, witty, and full of personality", value: 'Playful – Fun, witty, and full of personality' },
        { label: "Cheerful – Upbeat, positive, and encouraging", value: 'Cheerful – Upbeat, positive, and encouraging' },
    ];

    return (
        <div className='setting-block'>
            <div className='settings_secion-1 ai_parent first-card'>
                <div className='start_main_container_sub_heading left-content'>
                    <p className="text-[13px] font-semibold mb-[6px]">
                        {t("aiSettings.chatbotSettings")}
                    </p>
                    <p className="text-[13px]">
                        {t("aiSettings.chatbotSettingsDescription")}
                    </p>
                </div>
                <div className='ai-card-wrapper'>
                    <BlockStack gap="400">
                        <Card roundedAbove="sm">
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <></>
                                    }
                                    isActivateButtonLoading={aiWidgetData.loading}
                                    availableOn={t("settings.planName3")}
                                    isActivated={aiWidgetData.enabled}
                                    title={t("aiSettings.enableChatWidget")}
                                    description={t("aiSettings.enableChatWidgetDescription")}
                                    handleActivateButton={handleChatExtensionActivateButton}
                                    buttonType={"chatExtensionActivateButton"}
                                    activateButtonTitle={aiWidgetData.enabled ? t("aiSettings.disableChatWidget") : t("aiSettings.activateChatWidget")}
                                    isActivateButtonDisabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))}
                                />
                            )}
                            <div className='divider-ai' />
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <div className="w-1/3 field">
                                            <Select
                                                options={options}
                                                label=""
                                                onChange={(v) => {
                                                    setAISettings({ ...aiSettings, toneOfVoice: v })
                                                }}
                                                value={aiSettings.toneOfVoice}
                                                disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                                placeholder={t("aiSettings.selectTone")}
                                            />
                                        </div>
                                    }
                                    title={t("aiSettings.tone")}
                                    description={t("aiSettings.toneDescription")}
                                // activateButtonTitle={aiSettings.isDurationToSendMessageActivated ? t("settings.deactivate") : t("settings.activate")}
                                />
                            )}
                            <div className='divider-ai' />
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <></>
                                    }
                                    title={t("aiSettings.useEmojis")}
                                    description={t("aiSettings.useEmojisDescription")}
                                    activateButtonTitle={aiSettings.isUseEmojisTurnedOn ? t("aiSettings.turnOff") : t("aiSettings.turnOn")}
                                    isActivateButtonLoading={loading.activeButton === "useEmojisTurnedOnButton"}
                                    isActivateButtonDisabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan) || loading.activeButton)}
                                    handleActivateButton={(data: any) => {
                                        const settingKey = activateButtons[data];
                                        setAISettings((p: any) => ({ ...p, [settingKey]: !aiSettings[settingKey] }))
                                        setActivateButtonActionType(data)
                                    }}
                                    buttonType={"useEmojisTurnedOnButton"}
                                    isActivated={aiSettings.isUseEmojisTurnedOn}
                                />
                            )}
                            <div className='divider-ai' />
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <ChatIconSettings
                                            setAISettings={setAISettings}
                                            aiSettings={aiSettings}
                                            disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                            t={t}
                                        />
                                    }
                                    title={t("aiSettings.style")}
                                    description={""}
                                />
                            )}
                        </Card>
                    </BlockStack>
                </div>
            </div>
            <div className='settings_secion-1 ai_parent first-card second-card mt-4'>
                <div className='start_main_container_sub_heading left-content'>
                    <p className="text-[13px] font-semibold mb-[6px]">
                        {t("aiSettings.trainingTopicsTitle")}
                    </p>
                    <p className="text-[13px]">
                        {t("aiSettings.trainingTopicsDescription")}
                    </p>
                </div>
                <div className='ai-card-wrapper'>
                    <BlockStack gap="400">

                        {/* <Card roundedAbove="sm">
                            {isSettingsLoading ? (
                                <SkeletonLoading
                                    secondLines={4}
                                />
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <div className="w-3/4">
                                            <MultiselectTagCombobox
                                                placeholder={"Select training topics"}
                                                data={topics}
                                                selectedTags={aiSettings.trainingTopics}
                                                setSelectedTags={(v: any) => {
                                                    if (v?.length === 0) return shopify.toast.show("Topic selection field cannot be empty.")
                                                    if (v.includes("All training topics")) {
                                                        setAISettings({ ...aiSettings, trainingTopics: topics })
                                                        handleSaveSettings({ ...aiSettings, trainingTopics: topics })
                                                    } else {
                                                        setAISettings({ ...aiSettings, trainingTopics: v })
                                                        handleSaveSettings({ ...aiSettings, trainingTopics: v })
                                                    }
                                                }}
                                                value={topicSearchValue}
                                                setValue={setTopicSearchValue}
                                                isDisabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                            />
                                        </div>
                                    }
                                    title={"Training Topics"}
                                    description={"Select which topics the AI should learn from your store.This helps the assistant respond accurately to customer questions."}
                                />
                            )}
                        </Card> */}
                        <Card>
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : <SettingsSecondBlock
                                children={
                                    <></>
                                }
                                title={t("aiSettings.startSync")}
                                description={t("aiSettings.startSyncDescription")}
                                handleActivateButton={(data: any) => {
                                    handleSyncing()
                                }}
                                isActivated={false}
                                isActivateButtonLoading={loading.syncing}
                                buttonType="syncButton"
                                activateButtonTitle={t("aiSettings.start")}
                                isActivateButtonDisabled={(!isProPlanOrHigher(selectedPlanName) &&
                                    !isProPlanOrHigher(permissions?.manualPlan)) ||
                                    loading.activeButton}
                            />}
                            <div className='divider-ai' />
                            {isSettingsLoading ? (
                                <div className='w-[53.4rem]'>
                                    <SkeletonLoading />
                                </div>
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <></>
                                    }
                                    availableOn={t("settings.planName4")}
                                    title={t("aiSettings.turnOnAssistant")}
                                    description={t("aiSettings.turnOnAssistantDescription")}
                                    activateButtonTitle={aiSettings.isWhatsappAssistantTurnedOn ? t("aiSettings.turnOff") : t("aiSettings.turnOn")}
                                    isActivateButtonLoading={loading.activeButton === "whatsappAssistantTurnedOnButton"}
                                    isActivateButtonDisabled={(!isAdvancePlanOrHigher(selectedPlanName) && !isAdvancePlanOrHigher(permissions?.manualPlan) || loading.activeButton)}
                                    handleActivateButton={(data: any) => {
                                        const settingKey = activateButtons[data];
                                        setAISettings((p: any) => ({ ...p, [settingKey]: !aiSettings[settingKey] }))
                                        setActivateButtonActionType(data)
                                    }}
                                    buttonType={"whatsappAssistantTurnedOnButton"}
                                    isActivated={aiSettings.isWhatsappAssistantTurnedOn}
                                />
                            )}
                        </Card>
                    </BlockStack>
                </div>
            </div>
        </div>
    )
}
