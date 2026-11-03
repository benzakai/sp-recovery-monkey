import { Card, Icon, Select, Spinner, Text } from '@shopify/polaris'
import { InfoIcon } from '@shopify/polaris-icons'
import SkeletonLoading from './SkeletonLoading'
import SettingsSecondBlock from './SettingsSecondBlock'

// One editable WhatsApp message (heading + body), its send timing and its Activate button.
// The message is stored as { header, content } like followUpMessage so the external sender reads it the same way.
export default function MessageSettingCard({
    t,
    isSettingsLoading,
    isMessageLoading,
    settings,
    setSettings,
    loading,
    handleActivateButton,
    isDisabled,
    title,
    description,
    messageKey,
    durationKey,
    activatedKey,
    buttonType,
    durationOptions,
    durationDescription,
    hint,
}: any) {
    const updateMessage = (field: "header" | "content", value: string) => {
        setSettings((prev: any) => ({
            ...prev,
            [messageKey]: {
                ...prev[messageKey],
                [field]: value
            }
        }))
    }

    return (
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
                                    <Spinner accessibilityLabel="Loading message" size="large" />
                                </div> : <div className="flex-col" >
                                    <textarea
                                        className="w-full h-7 border-none outline-none text-base"
                                        value={settings?.[messageKey]?.header}
                                        onChange={(e) => updateMessage("header", e.target.value)}
                                        placeholder={t("settings.messageBoxHeadingPlaceholder")}
                                        disabled={isDisabled}
                                    />
                                    <textarea
                                        className="w-full h-40 text-base border-none outline-none"
                                        value={settings?.[messageKey]?.content}
                                        onChange={(e) => updateMessage("content", e.target.value)}
                                        placeholder={t("settings.messageBoxContentPlaceholder")}
                                        disabled={isDisabled}
                                    />
                                </div>}
                            </Card>
                            {hint && (
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="flex shrink-0"><Icon source={InfoIcon} tone="subdued" /></div>
                                    <Text as="p" variant="bodySm" tone="subdued">{hint}</Text>
                                </div>
                            )}
                        </div>
                    }
                    title={title}
                    description={description}
                    availableOn={"Pro"}
                    activateButtonTitle={settings[activatedKey] ? t("settings.deactivate") : t("settings.activate")}
                    isActivateButtonLoading={loading.activeButton === buttonType}
                    isActivateButtonDisabled={isDisabled || loading.activeButton}
                    handleActivateButton={handleActivateButton}
                    buttonType={buttonType}
                    isActivated={settings[activatedKey]}
                />
            )}
            {isSettingsLoading ? (
                <SkeletonLoading />
            ) : (
                <SettingsSecondBlock
                    children={
                        <div className="w-1/3">
                            <Select
                                options={durationOptions}
                                label=""
                                disabled={isDisabled}
                                onChange={(v) => {
                                    setSettings((prev: any) => ({ ...prev, [durationKey]: v }))
                                }}
                                value={settings[durationKey]}
                            />
                        </div>
                    }
                    title={""}
                    description={durationDescription}
                />
            )}
        </Card>
    )
}
