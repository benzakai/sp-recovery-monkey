import AbandonedCartSVG from './SVGs/AbandonedCartSVG';
import MissedRevenueSVG from './SVGs/MissedRevenueSVG';
import RecoveredRevenueSVG from './RecoveredRevenueSVG';
import ACRRateSVG from './ACRRateSVG';
import * as React from "react";

export default function StartPageCartSummary({ getPageData }: any) {
    console.log("getPageData StartPageCartSummary", getPageData);
    const [getCards, setCards] = React.useState([
        {
            id: 1,
            value: "Loading",
            icon: <AbandonedCartSVG />,
            title: "Abandoned Carts",
            description: "Customers waiting for you to complete their purchase"
        },
        {
            id: 2,
            value: "Loading",
            icon: <MissedRevenueSVG />,
            title: "Missed Revenue",
            description: "The amount you could have earned from these carts"
        },
        {
            id: 3,
            value: "Loading",
            icon: <RecoveredRevenueSVG />,
            title: "Recovered Revenue",
            description: "When you make money with our help, it appears here"
        },
        {
            id: 4,
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
                    value: getPageData?.abandonedCarts?.length,
                    icon: <AbandonedCartSVG />,
                    title: "Abandoned Carts",
                    description: "Customers waiting for you to complete their purchase"
                },
                {
                    id: 2,
                    value: `${getPageData?.shopCurrency}${getPageData?.abandonedCartsSum}`,
                    icon: <MissedRevenueSVG />,
                    title: "Missed Revenue",
                    description: "The amount you could have earned from these carts"
                },
                {
                    id: 3,
                    value: `${getPageData?.shopCurrency}${getPageData?.recoveredCartsSum}`,
                    icon: <RecoveredRevenueSVG />,
                    title: "Recovered Revenue",
                    description: "When you make money with our help, it appears here"
                },
                {
                    id: 4,
                    value: isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`,
                    icon: <ACRRateSVG />,
                    title: "ACR Rate",
                    description: "The amount of income waiting for recovery"
                }
            ]);
        }
    }, [getPageData]);

    return (
        <div className='bg-white rounded-xl shadow-sm border border-solid border-[#B5B5B5] p-6'>
            <div className='flex justify-around items-center'>
                {
                    getCards.map((card, index) => {
                        return (
                            <div key={index} className='flex flex-col w-1/4 justify-center items-center text-center'>
                                <div>{card.icon}</div>
                                {card.value === "Loading" ? (
                                    <div className="animate-pulse space-y-2 my-3">
                                        <div className="bg-gray-300 rounded h-5 w-24"></div>
                                    </div>
                                ) : (
                                    <div className='font-bold text-2xl pt-4 pb-3'>{card.value}</div>
                                )}
                                <div className='font-semibold text-2xl pb-1'>{card.title}</div>
                                <div className='text-base text-[#6B7177] w-[75%]'>{card.description}</div>
                            </div>
                        );
                    })
                }
            </div>
        </div>

    )
}