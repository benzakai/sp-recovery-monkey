import { Badge, Banner, BlockStack, Button, Card, InlineStack, Select, Spinner, Text, Thumbnail } from '@shopify/polaris'
import React from 'react'
import SkeletonLoading from './SkeletonLoading'
import SettingsSecondBlock from './SettingsSecondBlock'
import MultiselectTagCombobox from '../MultiselectTagCombobox'

export default function SettingsSection({
    t,
    isSettingsLoading,
    settings,
    setSettings,
    loading,
    handleActivateButton,
    languages,
    setLanguageSearchValue,
    languageSearchValue,
    isProPlanOrHigher,
    selectedPlanName,
    permissions,
    isMessageLoading
}: any) {
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
    return (
        <div className='setting-block'>
            <div className='settings_secion-1 setting_right_cart'>
                
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
                                secondClass='w-10/12 mt-8 mb-4'
                                secondLines={14}
                            />
                        ) : (
                            <SettingsSecondBlock
                                children={
                                    <div className="w-10/12">
                                        <Card>
                                            {isMessageLoading ? <div className='flex justify-center items-center h-72'>
                                                <Spinner accessibilityLabel="Small spinner example" size="large" />
                                            </div> : <div className="flex-col" >
                                                <textarea
                                                    className="w-full h-7 border-none outline-none text-base"
                                                    value={settings?.followUpMessage?.header}
                                                    onChange={(e) => {
                                                        setSettings((prev: any) => ({
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
                                                        setSettings((prev: any) => ({
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
                                                {/* <div className='flex justify-end pr-3 pt-4'>
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
                                                </div> */}
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
                    {/* <Card roundedAbove="sm">
                        <div className='p-4'>
                            <InlineStack wrap={false} gap="400">
                                <Thumbnail
                                    source="/images/judgemeLogo.webp"
                                    alt="Judge.me logo"
                                    size='small'
                                />
                                <div>
                                    <Text as="p" variant="bodyLg" fontWeight="bold">Judge.me<span className='pl-2'><Badge tone='info' >Pro</Badge></span></Text>
                                    <Text as="p" variant="bodyLg">Gather Valuable Reviews with Judge.me Integration.</Text>
                                </div>
                            </InlineStack>
                            <div className='pt-4'>
                                <Banner >
                                    <Text as="p" variant="bodyLg">
                                        This review request flow requires integration with Judge.me Product Reviews app.
                                    </Text>
                                </Banner>
                            </div>
                            <div className='flex pt-4 justify-end'>
                                <Button
                                    variant="primary" tone={settings.judgeme === "yes" ? "critical" : undefined}
                                    size='large' loading={isSettingsLoading || loading.judgemeButtonLoading}
                                    disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    onClick={async () => {
                                        setLoading((p: any) => ({ ...p, judgemeButtonLoading: true }))
                                        const { success }: any = await handleSaveSettings({ ...settings, judgeme: settings.judgeme === "yes" ? "no" : "yes" })
                                        success && setSettings((prev: any) => ({ ...prev, judgeme: settings.judgeme === "yes" ? "no" : "yes" }))
                                        setLoading((p: any) => ({ ...p, judgemeButtonLoading: false }))
                                    }}
                                >{settings.judgeme === "yes" ? "Deactivate Review Request flow" : "Activate Review Request flow"}</Button>
                            </div>
                        </div>
                    </Card> */}
                </BlockStack>
            </div>
        </div>
    )
}
