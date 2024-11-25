import { Card, SkeletonDisplayText } from '@shopify/polaris';
import cartLogo from '../routes/images/cart.png';
import bagLogo from '../routes/images/bag.png';
import dollarLogo from '../routes/images/dollar.png';
import tickmarkLogo from '../routes/images/TickMark.png';

export default function AbandonedCartsSummary({ getPageData }) {
    return (
        <Card>
            <div className='start_pricing_plans'>
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
            </div>
        </Card>
    )
}