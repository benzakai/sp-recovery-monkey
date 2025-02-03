import { Button, Card, SkeletonDisplayText } from '@shopify/polaris';
import cartLogo from '../routes/images/cart.png';
import bagLogo from '../routes/images/bag.png';
import dollarLogo from '../routes/images/dollar.png';
import tickmarkLogo from '../routes/images/TickMark.png';
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
                    value: getPageData?.abandonedCarts?.length,
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
                                <div className="animate-pulse space-y-2 my-3">
                                    <div className="bg-gray-300 rounded h-5 w-24"></div>
                                </div>
                            ) : (
                                <div className='font-bold text-2xl pt-4 pb-3'>{card.value}</div>
                            )}
                            <div className='font-semibold text-2xl pb-1'>{card.title}</div>
                            <div className='text-base text-[#6B7177] w-[75%]'>{card.description}</div>
                        </div>
                    })
                }
            </div>
            {/* <div className='start_pricing_plans'>
                <div className='start_pricing_plans_card'>
                    <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={cartLogo} alt="" /></div>
                    <div className='start_plan_content_value'>
                        {
                            getPageData?.abandonedCarts?.length > 0 ?
                                (<div style={{ height: "20px" }}>{getPageData?.abandonedCarts?.length}</div>) :
                                (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='start_plan_content_heading'>Abandoned Carts</div>
                    <div className='start_plan_content_sub_heading'>Customers waiting for you to complete their purchase</div>
                </div>
                <div className='start_pricing_plans_card'>
                    <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={bagLogo} alt="" /></div>
                    <div className='start_plan_content_value'>
                        {
                            getPageData?.abandonedCarts?.length > 0 ?
                                (<div style={{ height: "20px" }}>{getPageData?.shopCurrency}{getPageData?.abandonedCartsSum}</div>) :
                                (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='start_plan_content_heading'>Missed Revenue</div>
                    <div className='start_plan_content_sub_heading'>The amount you could have earned from these carts</div>
                </div>
                <div className='start_pricing_plans_card'>
                    <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={dollarLogo} alt="" /></div>
                    <div className='start_plan_content_value'>
                        {
                            getPageData?.recoveredCarts?.length > 0 ?
                                (<div style={{ height: "20px" }}>{getPageData?.shopCurrency}{getPageData?.recoveredCartsSum}</div>) :
                                (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='start_plan_content_heading'>Recovered Revenue</div>
                    <div className='start_plan_content_sub_heading'>When you make money with our help, it appears here</div>
                </div>
                <div className='start_pricing_plans_card'>
                    <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={tickmarkLogo} alt="" /></div>
                    <div className='start_plan_content_value'>
                        {
                            getPageData?.acrRate != null ?
                                (<div style={{ height: "20px" }}>{isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`}</div>) :
                                (<div style={{ height: "20px", paddingLeft: "20px" }}><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='start_plan_content_heading'>ACR Rate</div>
                    <div className='start_plan_content_sub_heading'>The amount of income waiting for recovery</div>
                </div>
            </div> */}
            {/* <div className=''>
                <div className=''>
                    <div className=''><RecoveredCartsSVG /></div>
                    <div className='font-extrabold'>
                        {
                            getPageData?.abandonedCarts?.length > 0 ?
                                (<div>{getPageData?.abandonedCarts?.length}</div>) :
                                (<div><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='font-semibold'>Abandoned Carts</div>
                    <div className=''>Customers waiting for you to complete their purchase</div>
                </div>
                <div className='start_pricing_plans_card'>
                    <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={bagLogo} alt="" /></div>
                    <div className='start_plan_content_value'>
                        {
                            getPageData?.abandonedCarts?.length > 0 ?
                                (<div style={{ height: "20px" }}>{getPageData?.shopCurrency}{getPageData?.abandonedCartsSum}</div>) :
                                (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className='start_plan_content_heading'>Missed Revenue</div>
                    <div className='start_plan_content_sub_heading'>The amount you could have earned from these carts</div>
                </div>
                <div className=''>
                    <div className=''><RecoveredRevenueSVG /></div>
                    <div className=''>
                        {
                            getPageData?.recoveredCarts?.length > 0 ?
                                (<div>{getPageData?.shopCurrency}{getPageData?.recoveredCartsSum}</div>) :
                                (<div><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className=''>Recovered Revenue</div>
                    <div className=''>When you make money with our help, it appears here</div>
                </div>
                <div className=''>
                    <div className=''><ACRRateSVG /></div>
                    <div className=''>
                        {
                            getPageData?.acrRate != null ?
                                (<div>{isNaN(getPageData?.acrRate) ? "0.00%" : `${getPageData?.acrRate}%`}</div>) :
                                (<div><SkeletonDisplayText size="small" /></div>)
                        }
                    </div>
                    <div className=''>ACR Rate</div>
                    <div className=''>The amount of income waiting for recovery</div>
                </div>
            </div> */}
        </div>
    )
}