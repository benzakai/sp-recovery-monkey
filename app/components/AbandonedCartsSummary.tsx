import RecoveredCartsSVG from './SVGs/RecoveredCartsSVG';
import RecoveredRevenueSVG from './SVGs/RecoveredRevenueSVG';
import ACRRateSVG from './SVGs/ACRRateSVG';
import * as React from "react";
import AbandonedCartSVG from './SVGs/AbandonedCartSVG';
import { useTranslation } from 'react-i18next';

export default function AbandonedCartsSummary({ getPageData, forPageType }: any) {
    const { t } = useTranslation();

    const [getCards, setCards] = React.useState([
        {
            id: 1,
            value: "Loading",
            icon: <RecoveredCartsSVG />,
            title: t("global.icons.recoveredCarts"),
            description: t("global.icons.recoveredCartsDescription")
        },
        (forPageType === "WelcomeConnect" ? {
            id: 4,
            value: "Loading",
            icon: <AbandonedCartSVG />,
            title: t("global.icons.abandonedCarts"),
            description: t("global.icons.abandonedCartsDescription")
        } : {}),
        {
            id: 2,
            value: "Loading",
            icon: <RecoveredRevenueSVG />,
            title: t("global.icons.recoveredRevenue"),
            description: t("global.icons.recoveredRevenueDescription")
        },
        {
            id: 3,
            value: "Loading",
            icon: <ACRRateSVG />,
            title: t("global.icons.ACRRate"),
            description: t("global.icons.ACRRateDescription")
        }
    ]);

    React.useEffect(() => {
        if (getPageData && getPageData?.success) {
            setCards([
                {
                    id: 1,
                    value: getPageData?.recoveredCarts,
                    icon: <RecoveredCartsSVG />,
                    title: t("global.icons.recoveredCarts"),
                    description: t("global.icons.recoveredCartsDescription")
                },
                (forPageType === "WelcomeConnect" ? {
                    id: 4,
                    value: getPageData?.abandonedCarts,
                    icon: <AbandonedCartSVG />,
                    title: t("global.icons.abandonedCarts"),
                    description: t("global.icons.abandonedCartsDescription")
                } : {}),
                {
                    id: 2,
                    value: `${getPageData?.shopCurrency}${getPageData?.recoveredCartsSum}`,
                    icon: <RecoveredRevenueSVG />,
                    title: t("global.icons.recoveredRevenue"),
                    description: t("global.icons.recoveredRevenueDescription")
                },
                {
                    id: 3,
                    value: isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`,
                    icon: <ACRRateSVG />,
                    title: t("global.icons.ACRRate"),
                    description: t("global.icons.ACRRateDescription")
                }
            ]);
        }
    }, [getPageData]);

    return (
        <div className='bg-white rounded-xl shadow-sm border border-solid border-[#B5B5B5]'>
            <div className='flex flex-row gap-4 justify-center items-start pt-6 pb-8 font-inter welcome_wrapper'>
                {
                    getCards.map((card) => {
                        if (!card?.id) return null;
                        return (
                            <div key={card.id} className='flex flex-col justify-center items-center text-center w-1/4 m-4 welcome_wrapper_content'>
                                <div>{card.icon}</div>
                                {card.value === "Loading" ? (
                                    <div className="animate-pulse space-y-2 pt-4 pb-3">
                                        <div className="bg-gray-300 rounded h-8 w-28"></div>
                                    </div>
                                ) : (
                                    <div className='font-bold text-2xl pt-4 pb-3'>{card.value}</div>
                                )}
                                <div className='font-semibold text-2xl pb-1'>{card.title}</div>
                                <div className='text-base text-[#6B7177] w-[85%]'>{card.description}</div>
                            </div>
                        );
                    })
                }
            </div>
        </div>

    );
}
