export default function ConfirmationModal({
    handlePrimaryClick,
    handleSecondClick,
    primaryButtonText,
    secondaryButtonText,
    content,
    title,
    id
}: any) {
    return (
        <ui-modal id={id}>
            <p className='pt-6 pl-4 text-base pb-8'>{content}</p>
            <ui-title-bar title={title}>
                <button variant="primary" onClick={handlePrimaryClick}>{primaryButtonText}</button>
                <button onClick={handleSecondClick}>{secondaryButtonText}</button>
            </ui-title-bar>
        </ui-modal>
    )
}
