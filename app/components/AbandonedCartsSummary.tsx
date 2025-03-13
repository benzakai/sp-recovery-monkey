import RecoveredCartsSVG from './SVGs/RecoveredCartsSVG';
import RecoveredRevenueSVG from './SVGs/RecoveredRevenueSVG';
import ACRRateSVG from './SVGs/ACRRateSVG';
import * as React from "react";
import AbandonedCartSVG from './SVGs/AbandonedCartSVG';

export default function AbandonedCartsSummary({ getPageData, forPageType }: any) {
    // console.log("getPageData AbandonedCartsSummary", getPageData);
    const [getCards, setCards] = React.useState([
        {
            id: 1,
            value: "Loading",
            icon: <RecoveredCartsSVG />,
            title: "Recovered Carts",
            description: "Customers who completed their purchase"
        },
        (forPageType === "WelcomeConnect" ? {
            id: 4,
            value: "Loading",
            icon: <AbandonedCartSVG />,
            title: "Abandoned Carts",
            description: "Picture the profits you missed from these abandoned carts."
        } : {}),
        {
            id: 2,
            value: "Loading",
            icon: <RecoveredRevenueSVG />,
            title: "Recovered Revenue",
            description: "When you make money with our help, it appears here"
        },
        {
            id: 3,
            value: "Loading",
            icon: <ACRRateSVG />,
            title: "ACR Rate",
            description: "The amount of income waiting for recovery"
        }
    ]);

    React.useEffect(() => {
        if (getPageData && getPageData?.success) {
            // console.log("triggered", getPageData);
            setCards([
                {
                    id: 1,
                    value: getPageData?.recoveredCarts,
                    icon: <RecoveredCartsSVG />,
                    title: "Recovered Carts",
                    description: "Customers who completed their purchase"
                },
                (forPageType === "WelcomeConnect" ? {
                    id: 4,
                    value: getPageData?.abandonedCarts,
                    icon: <AbandonedCartSVG />,
                    title: "Abandoned Carts",
                    description: "Picture the profits you missed from these abandoned carts."
                } : {}),
                {
                    id: 2,
                    value: `${getPageData?.shopCurrency}${getPageData?.recoveredCartsSum}`,
                    icon: <RecoveredRevenueSVG />,
                    title: "Recovered Revenue",
                    description: "When you make money with our help, it appears here"
                },
                {
                    id: 3,
                    value: isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`,
                    icon: <ACRRateSVG />,
                    title: "ACR Rate",
                    description: "The amount of income waiting for recovery"
                }
            ]);
        }
    }, [getPageData]);

    return (
        <div className='bg-white rounded-xl shadow-sm border border-solid border-[#B5B5B5]'>
            <div className='flex gap-4 justify-center items-center pt-6 pb-8 font-inter'>
                {
                    getCards.map((card) => {
                        return <div className='flex flex-col justify-center items-center text-center'>
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
                    })
                }
            </div>
        </div>
    )
}