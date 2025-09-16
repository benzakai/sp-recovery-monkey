import { SaveBar } from '@shopify/app-bridge-react';

export default function SaveBarComponent({ id = 'save-bar', onSave, onDiscard, saveText, discardText, variant = "primary", isLoading = false }: any) {
    return (
        <SaveBar id={id}>
            <button variant={variant} loading={isLoading} onClick={onSave}>{saveText}</button>
            <button onClick={onDiscard}>{discardText}</button>
        </SaveBar>
    )
}
