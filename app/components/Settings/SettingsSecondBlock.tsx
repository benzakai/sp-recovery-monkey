import { Badge, BlockStack, Button, InlineStack, Text } from "@shopify/polaris";


export default function SettingsSecondBlock({
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
}: any) {
    return (
        <div className='p-4'>
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
        </div>
    )
}
