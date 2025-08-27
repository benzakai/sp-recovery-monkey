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
    handleSaveSettings,
    handleSyncing,
    loading,
    topics,
    handleActivateButton,
    isProPlanOrHigher,
    selectedPlanName,
    permissions,
    handleChatExtensionActivateButton
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
            <div className='settings_secion-1 w-4/5'>
                <div className='start_main_container_sub_heading'>
                    <Text variant="headingXl" as="h3">
                        Chatbot Settings
                    </Text>
                </div>
                <BlockStack gap="400">
                    <Card roundedAbove="sm">
                        {isSettingsLoading ? (
                            <SkeletonLoading />
                        ) : (
                            <SettingsSecondBlock
                                children={
                                    <></>
                                }
                                availableOn={"Pro"}
                                title={"Enable AI chat widget on your store"}
                                description={"Click to activate the AI chat widget on your store. This allows customers to chat with AI assistant directly from your website."}
                                handleActivateButton={handleChatExtensionActivateButton}
                                buttonType={"chatExtensionActivateButton"}
                                activateButtonTitle={"Activate AI chat widget"}
                                isActivateButtonDisabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))}
                            />
                        )}
                    </Card>
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
                                                setAISettings({ ...aiSettings, toneOfVoice: v })
                                                handleSaveSettings({ ...aiSettings, toneOfVoice: v })
                                            }}
                                            value={aiSettings.toneOfVoice}
                                            disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                            placeholder={"Select tone"}
                                        />
                                    </div>
                                }
                                title={"Tone of Voice"}
                                description={"Choose how your assistant sounds in chats — professional, friendly, or even a bit playful."}
                            // activateButtonTitle={aiSettings.isDurationToSendMessageActivated ? t("settings.deactivate") : t("settings.activate")}
                            />
                        )}
                    </Card>

                    <Card roundedAbove="sm">
                        {isSettingsLoading ? (
                            <SkeletonLoading />
                        ) : (
                            <SettingsSecondBlock
                                children={
                                    <></>
                                }
                                title={"Use Emojis"}
                                description={"Turn on to add a touch of personality to your messages with emojis"}
                                activateButtonTitle={aiSettings.isUseEmojisTurnedOn ? "Turn off" : "Turn on"}
                                isActivateButtonLoading={loading.activeButton === "useEmojisTurnedOnButton"}
                                isActivateButtonDisabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan) || loading.activeButton)}
                                handleActivateButton={handleActivateButton}
                                buttonType={"useEmojisTurnedOnButton"}
                                isActivated={aiSettings.isUseEmojisTurnedOn}
                            />
                        )}
                    </Card>

                    <Card roundedAbove="sm">
                        {isSettingsLoading ? (
                            <SkeletonLoading />
                        ) : (
                            <SettingsSecondBlock
                                children={
                                    <ChatIconSettings
                                        setAISettings={setAISettings}
                                        aiSettings={aiSettings}
                                        handleSaveSettings={handleSaveSettings}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    />
                                }
                                title={"Style Preferences"}
                                description={""}
                            />
                        )}
                    </Card>
                </BlockStack>
                <div className='start_main_container_sub_heading mt-10'>
                    <div className='mb-5'>
                        <Text variant="headingXl" as="h3">
                            AI Store Sync
                        </Text>
                        <Text as="p" variant="bodyLg">
                            Connect your assistant to store data and start training
                        </Text>
                    </div>
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
                        <div className="w-full sm:w-4/6 md:w-3/6 lg:w-2/6">
                            <Card>
                                <div className="px-3 mt-2 mb-4">
                                    <Text variant="bodyLg" fontWeight="bold" as="p">
                                        Start Syncing
                                    </Text>
                                </div>
                                <div className="px-3 mb-8">
                                    <Text variant="bodyLg" as="p">
                                        Connect your store data and let the AI start learning.
                                    </Text>
                                </div>
                                <div className="text-center mb-8">
                                    <Button
                                        onClick={handleSyncing}
                                        variant="primary"
                                        size="large"
                                        loading={loading.syncing}
                                        disabled={
                                            (!isProPlanOrHigher(selectedPlanName) &&
                                                !isProPlanOrHigher(permissions?.manualPlan)) ||
                                            loading.activeButton
                                        }
                                    >
                                        Click here to start syncing
                                    </Button>
                                </div>
                                <div className="flex justify-center mb-12">
                                    <AlienSVG />
                                </div>
                            </Card>
                        </div>
                        <Card roundedAbove="sm">
                            {isSettingsLoading ? (
                                <SkeletonLoading />
                            ) : (
                                <SettingsSecondBlock
                                    children={
                                        <></>
                                    }
                                    availableOn={"Advanced"}
                                    title={"Turn on your WhatsApp assistant"}
                                    description={"Let the AI handle chats for you on WhatsApp — from answering common questions to keeping the conversation flowing."}
                                    activateButtonTitle={aiSettings.isWhatsappAssistantTurnedOn ? "Turn off" : "Turn on"}
                                    isActivateButtonLoading={loading.activeButton === "whatsappAssistantTurnedOnButton"}
                                    isActivateButtonDisabled={(!isAdvancePlanOrHigher(selectedPlanName) && !isAdvancePlanOrHigher(permissions?.manualPlan) || loading.activeButton)}
                                    handleActivateButton={handleActivateButton}
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
