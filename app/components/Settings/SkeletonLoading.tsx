import { BlockStack, SkeletonBodyText } from "@shopify/polaris";

export default function SkeletonLoading({ firstClass = "w-1/3 mt-1", secondClass = "w-1/2 mt-6 mb-4", firstLines = 1, secondLines = 3 }: any) {
    return (
        <BlockStack gap="600">
            <BlockStack gap="400">
                <div className={firstClass}>
                    <SkeletonBodyText lines={firstLines} />
                </div>
                <div className={secondClass}>
                    <SkeletonBodyText lines={secondLines} />
                </div>
            </BlockStack>
        </BlockStack>
    )
}
