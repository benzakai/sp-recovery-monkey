import * as React from "react";
import { useTranslation } from 'react-i18next';
import { Text } from '@shopify/polaris';

export default function DashboardOverview({ getPageData, forPageType }: any) {
    const { t } = useTranslation();

    const [getCards, setCards] = React.useState([
        {
            id: 1,
            value: "Loading",
            title: t("global.icons.recoveredCarts"),
            description: t("global.icons.recoveredCartsDescription")
        },
        {
            id: 2,
            value: "Loading",
            title: t("global.icons.abandonedCarts"),
            description: t("global.icons.abandonedCartsDescription")
        },
        {
            id: 3,
            value: "Loading",
            title: t("global.icons.recoveredRevenue"),
            description: t("global.icons.recoveredRevenueDescription")
        },
        {
            id: 4,
            value: "Loading",
            title: t("global.icons.ACRRate"),
            description: t("global.icons.ACRRateDescription")
        },
    ]);

    React.useEffect(() => {
        if (getPageData && getPageData?.success) {
            setCards([
                {
                    id: 1,
                    value: getPageData?.recoveredCarts,
                    title: t("global.icons.recoveredCarts"),
                    description: t("global.icons.recoveredCartsDescription")
                },
                {
                    id: 2,
                    value: getPageData?.abandonedCarts,
                    title: t("global.icons.abandonedCarts"),
                    description: t("global.icons.abandonedCartsDescription")
                },
                {
                    id: 3,
                    value: `${getPageData?.shopCurrency}${getPageData?.recoveredCartsSum}`,
                    title: t("global.icons.recoveredRevenue"),
                    description: t("global.icons.recoveredRevenueDescription")
                },
                {
                    id: 4,
                    value: isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`,
                    title: t("global.icons.ACRRate"),
                    description: t("global.icons.ACRRateDescription")
                },
            ]);
        }
    }, [getPageData]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-solid p-4 md:p-6">
            <div className="pb-2 text-center md:text-left">
                <Text variant="headingLg" as="h5">
                    Overview
                </Text>
            </div>
            <div className="abandoned-block grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 font-inter welcome_wrapper">
                {getCards.map((card) => {
                    if (!card?.id) return null;
                    return (
                        <div
                            key={card.id}
                            className="bg-zinc-100 rounded-lg p-4 flex flex-col justify-between welcome_wrapper_content h-full min-h-[170px]"
                        >
                            {card.value === "Loading" ? (
                                <div className="animate-pulse space-y-2 pb-4">
                                    <div className="bg-gray-300 rounded h-8 w-28"></div>
                                </div>
                            ) : (
                                <div className="font-bold text-base pb-4">{card.value}</div>
                            )}
                            <div className="font-bold text-lg pb-2">{card.title}</div>
                            <div className="text-base text-gray-400">{card.description}</div>
                        </div>
                    );
                })}
            </div>

        </div>

    );
}
