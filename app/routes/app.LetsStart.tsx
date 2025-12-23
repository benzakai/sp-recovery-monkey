import { useEffect, useState } from 'react';
import '../StartPage.css';
import { useActionData, useNavigate, useOutletContext, useSubmit } from '@remix-run/react';
import { authenticate } from "../shopify.server";
import fireStoreCreateService from '~/services/fireStoreCreateService';
import { useTranslation } from 'react-i18next';
import PlanSection from '~/components/Settings/PlanSection';
import Testimonials from '~/components/HomePage/Testimonials/Testimonials';
import TopSaleBanner from '~/components/global/TopSaleBanner';

export const action = async ({ request }: any) => {
    const { session } = await authenticate.admin(request)
    const formData = await request.formData();
    const planName = formData.get("planName");
    // console.log("planName", planName);
    if (planName === "Free") {
        await fireStoreCreateService("subscriptions", session.shop, {
            storeId: session.shop,
            plan: "Free",
            status: "ACTIVE",
            startDate: new Date().toISOString(),
            endDate: ""
        }, {});
    } else {
        const { billing } = await authenticate.admin(request);
        const okay = await billing.require({
            plans: [planName],
            isTest: false,
            onFailure: async () => billing.request({
                plan: planName,
                isTest: false
            }),
        });
    }
    return { success: true, planName };
};

const LetsStart = () => {
    const { t } = useTranslation()
    const [planName, setPlanName] = useState('not set');
    const [isLoadingPlanButton, setLoadingPlanButton] = useState(null)
    const submit = useSubmit();
    const actionData = useActionData()
    const navigate = useNavigate()
    const { setAnySubscription, setSelectedPlanName }: any = useOutletContext()

    useEffect(() => {
        if (actionData?.success) {
            if (actionData?.planName === "Free") {
                setAnySubscription(true)
                setPlanName(planName);
                setSelectedPlanName("Free")
                shopify.toast.show(t("global.toastMessage.successSubscriptionCreated"));
                navigate('/app')
            }
        }
    }, [actionData])

    const handlePlanSelect = (planName: any) => {
        setLoadingPlanButton(planName)
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    return (
        <div className="body justify-center">
            <div className="start_page">
                {/* <div className="w-full flex justify-center mb-12">
                    <TopSaleBanner btnClass="saleBannerButton" className='cursor-pointer' />
                </div> */}

                <div className="letstart">
                    <PlanSection
                        t={t}
                        loadingPage={false}
                        loadingButton={isLoadingPlanButton}
                        planName={planName}
                        handlePlanSelect={handlePlanSelect}
                        pageType={"letsStart"}
                    />
                </div>

                <Testimonials />
            </div>
        </div>
    );




};

export default LetsStart;
