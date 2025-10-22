import React from 'react'

interface PopUpProps {
    id: string;
    component?: React.ReactNode;
    handleSecondaryAction?: () => void;
    handlePrimaryAction?: () => void;
    isShowPrimaryButton?: boolean;
    isShowSecondaryButton?: boolean;
    secondaryButtonText?: string;
    primaryButtonText?: string;
}

export default function PopUp({
    id,
    component = <div />,
    handleSecondaryAction = () => { },
    handlePrimaryAction = () => { },
    isShowPrimaryButton = false,
    isShowSecondaryButton = false,
    secondaryButtonText = "Close",
    primaryButtonText = "Confirm",
}: PopUpProps) {
    return (
        <ui-modal id={id}>
            {component}
            <ui-title-bar title="CartKeeper WhatsApp Connection Tutorial">
                {isShowPrimaryButton && <button variant="primary" onClick={handlePrimaryAction}>{primaryButtonText}</button>}
                {isShowSecondaryButton && <button onClick={handleSecondaryAction}>{secondaryButtonText}</button>}
            </ui-title-bar>
        </ui-modal>
    )
}
