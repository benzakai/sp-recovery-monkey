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
            <BlockStack>
                <InlineStack direction="row" align="space-between">
                    {title && <p className="text-[13px] font-semibold">
                        {title} <span className='pl-2'>{availableOn && <Badge tone={toneType} >{availableOn}</Badge>}</span>
                    </p>}
                    {buttonType && <Button
                        disabled={isActivateButtonDisabled}
                        // tone={isActivated ? 'critical' : 'success'}
                        variant="secondary"
                        loading={isActivateButtonLoading}
                        onClick={() => handleActivateButton(buttonType)}
                    >{activateButtonTitle}</Button>}
                </InlineStack>
                <p className="text-[13px] text-wrap mb-2 mt-1 cust_chatbot_desc">
                    {description}
                </p>
                {children}
            </BlockStack>
        </div>
    )
}
