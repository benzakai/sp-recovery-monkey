import * as React from "react";
import { useTranslation } from 'react-i18next';
import { Text } from '@shopify/polaris';
import Tooltip from "../global/Tooltip/Tooltip";

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
                <p className="text-[13px] font-semibold">
                    {t("dashboard.overview")}
                </p>
            </div>
            <div className="abandoned-block grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 font-inter welcome_wrapper">
                {getCards.map((card) => {
                    if (!card?.id) return null;
                    return (
                        <div
                            key={card.id}
                            className="bg-zinc-100 rounded-lg p-4 flex flex-col h-full min-h-[133px]"
                        >
                            <div className="min-h-[32px] mb-3">
                                {card.value === "Loading" ? (
                                    <div className="animate-pulse">
                                        <div className="bg-gray-300 rounded h-8 w-28"></div>
                                    </div>
                                ) : (
                                    <div className="font-semibold text-[13px]">
                                        {card.value}
                                    </div>
                                )}
                            </div>

                            <div className="font-semibold text-[13px] mb-2 min-h-[20px]">
                                {card.title}
                            </div>

                            <div className="text-[13px] leading-snug min-h-[36px]">
                                {card.id === 4 ? (
                                    <span className="inline text-gray-500">
                                        {card.description}
                                        <Tooltip minWidth="150px">
                                            <p className="text-[9px] text-[#5C5F62] leading-3">
                                                A good conversion rate would be between 20-35%.
                                            </p>
                                        </Tooltip>
                                    </span>
                                ) : (
                                    <span className="text-gray-500">
                                        {card.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>

    );
}
