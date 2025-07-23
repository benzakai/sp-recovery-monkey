import { Badge, Button, SkeletonBodyText, SkeletonDisplayText, Text } from '@shopify/polaris';
import ToggleSwitch from '../SubscriptionPlan/ToggleSwitch';
import { useEffect, useState } from 'react';

export default function PlanSection({ t, loadingPage, loadingButton, planName, handlePlanSelect, pageType }: any) {
    const [planIntervalType, setPlanIntervalType] = useState("Monthly");

    useEffect(() => {
        if (planName.includes("Yearly")) {
            setPlanIntervalType("Yearly");
        }
    }, [planName]);

    const isSelected = (type: string) =>
        (planIntervalType === "Monthly" && planName === type) ||
        (planIntervalType === "Yearly" && planName === `${type} Yearly`);

    const getPrice = (monthly: string, yearly: string) =>
        planIntervalType === "Monthly" ? monthly : yearly;

    const getBillingText = (monthlyYearly: string, yearlyBilling: string) =>
        planIntervalType === "Monthly" ? monthlyYearly : yearlyBilling;

    const plans = [
        {
            key: "Free",
            name: t("settings.planName1"),
            monthly: t("global.planNames.Free"),
            price: t("settings.planPrice1"),
            benefits: [t("settings.freeBenefit1"), t("settings.freeBenefit2")],
            disabled: planName === "Free",
        },
        {
            key: "Starter",
            name: t("settings.planName2"),
            monthly: "19$",
            yearly: "14.25$",
            original: "19.99$",
            priceLabel: t("settings.planPrice2"),
            benefits: [t("settings.starterBenefit1"), t("settings.starterBenefit2")],
        },
        {
            key: "Pro",
            name: t("settings.planName3"),
            monthly: "49$",
            yearly: "36.75$",
            original: "49.99$",
            priceLabel: t("settings.planPrice3"),
            benefits: [
                t("settings.proBenefit1"),
                t("settings.proBenefit2"),
                t("settings.proBenefit3"),
                t("settings.proBenefit4"),
                t("settings.proBenefit5"),
            ],
            badge: t("settings.popularBadgeText"),
        },
        {
            key: "Advance",
            name: t("settings.planName4"),
            monthly: "99$",
            yearly: "74.25$",
            original: "99.99$",
            priceLabel: t("settings.planPrice4"),
            benefits: [
                t("settings.advancedBenefit1"),
                t("settings.advancedBenefit2"),
                t("settings.advancedBenefit3"),
            ],
        },
    ];

    return (
        <div className="settings_secion-2">
            {pageType === "settings" && <div className="start_main_container_sub_heading mb-1">
                <Text variant="headingXl" as="h3">
                    {t("settings.planSectionTitle")}
                </Text>
            </div>}

            <div className="start_price_container">
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                    {loadingPage ? (
                        <div className="w-56">
                            <SkeletonBodyText lines={2} />
                        </div>
                    ) : (
                        <div className="my-auto">
                            {pageType === "settings" ? t("settings.planSectionDescription", {
                                planName: planName,
                            }) : <Text variant="headingXl" as="h3">
                                {t("home.priceSectionTitle")}
                            </Text>}
                        </div>
                    )}
                    <div>
                        <ToggleSwitch active={planIntervalType} setActive={setPlanIntervalType} />
                    </div>
                </div>

                <div className="flex flex-wrap justify-between gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.key}
                            className="relative border rounded-lg shadow bg-white flex flex-col justify-between basis-full sm:basis-[48%] lg:basis-[23.5%] overflow-hidden"
                        >
                            <div className='p-5'>
                                {plan.badge && (
                                    <div
                                        className="absolute top-9 -right-28 w-80 rotate-45 bg-neutral-300 text-black text-base font-bold text-center py-2 z-10"
                                    >
                                        {plan.badge}
                                    </div>
                                )}

                                <div>
                                    <div className="start_plan_name">{plan.name}</div>

                                    {plan.original && (
                                        <p
                                            className={`line-through text-sm ${planIntervalType === "Monthly" ? "text-transparent" : "text-gray-600"}`}
                                        >
                                            {plan.original}
                                        </p>
                                    )}


                                    <div className="my-2 flex flex-row">
                                        <div className="start_plan_ammount">{plan.key === "Free" ? plan.monthly : getPrice(plan.monthly!, plan.yearly!)}</div>
                                        {plan.priceLabel && <div className="start_plan_ammount_suffix">{plan.priceLabel}</div>}
                                    </div>

                                    {plan.priceLabel && (
                                        <p className="text-sm text-green-700">
                                            {getBillingText(
                                                t("settings.OrSaveAmountPerYear", { amount: Number(plan.yearly!.replace("$", "")) * 12, percent: 25 }),
                                                t("settings.BilledAnnually", { amount: Number(plan.yearly!.replace("$", "")) * 12 }),
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div className={(pageType !== "settings" && plan.key === "Free") ? 'mt-16 pt-2' : 'mt-4'}>
                                    {((pageType === "settings" && plan.key === "Free") ? false : true) && (
                                        <div className="start_plan_button_section">
                                            {loadingPage ? (
                                                <SkeletonDisplayText size="large" maxWidth="40ch" />
                                            ) : (
                                                <Button
                                                    fullWidth
                                                    size="large"
                                                    loading={loadingButton === ((planIntervalType === "Monthly" || plan.key === "Free") ? plan.key : `${plan.key} Yearly`)}
                                                    disabled={isSelected(plan.key)}
                                                    onClick={() =>
                                                        handlePlanSelect(
                                                            (planIntervalType === "Monthly" || plan.key === "Free") ? plan.key : `${plan.key} Yearly`
                                                        )
                                                    }
                                                    variant="primary"
                                                >
                                                    {isSelected(plan.key)
                                                        ? t("settings.planSelectedText")
                                                        : t("settings.planNotSelectedText")}
                                                </Button>
                                            )}
                                        </div>
                                    )}


                                    <ul className={`start_plan_list space-y-2 ${(pageType === "settings" && plan.key === "Free") ? "mt-36" : "mt-4"}`}>
                                        {plan.benefits.map((benefit: string, idx: number) => (
                                            <li className="start_plan_list_item" key={idx}>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {(plan.key !== "Free") && (
                                <div className="border-t border-gray-100 bg-gray-100 px-4 py-3 mt-4">
                                    <p className="text-sm text-gray-600">
                                        {t("settings.freeTrileText")}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
