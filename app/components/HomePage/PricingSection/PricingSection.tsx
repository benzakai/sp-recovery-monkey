import { useCallback, useEffect, useState } from 'react';
import { Button, Text } from '@shopify/polaris';
import { XIcon } from '@shopify/polaris-icons';

export default function PricingSection({ t, PlanSect }: any) {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("homePriceSectionHidden");
        if (stored === "true") {
            setIsHidden(true);
        }
    }, []);

    const handleHide = useCallback(() => {
        setIsHidden(true);
        localStorage.setItem("homePriceSectionHidden", "true");
    }, []);

    if (isHidden) return null;

    return (
        <div>
            <div className='flex items-start justify-between gap-4 mb-4'>
                <Text variant="headingLg" as="h5">
                    {t("homePostPayment.priceSectionTitle")}
                </Text>
                <Button
                    icon={XIcon}
                    variant="plain"
                    onClick={handleHide}
                    accessibilityLabel="Hide pricing section"
                />
            </div>
            {PlanSect}
        </div>
    );
}
