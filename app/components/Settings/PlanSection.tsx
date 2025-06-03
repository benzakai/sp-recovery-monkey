import { Badge, Button, Card, SkeletonBodyText, SkeletonDisplayText, Text } from '@shopify/polaris'

export default function PlanSection({ t, loadingPage, planName, handlePlanSelect }: any) {
    return (
        <div className='settings_secion-2'>
            <div className='start_main_container_sub_heading' style={{ marginBottom: "2px" }}>
                <Text variant="headingXl" as="h3">
                    {t("settings.planSectionTitle")}
                </Text>
            </div>
            <div className="start_price_container">
                <div className="upgrade_page_container_heading">
                    {loadingPage ? <div className='w-56'><SkeletonBodyText lines={2} /> </div> :
                        <div className='upgrade_page_container_heading_text'>{t("settings.planSectionDescription", { planName: t(`global.planNames.${planName}`) })}</div>}
                </div>
                <div className="start_price_container_cards">
                    <Card>
                        <div className="start_price_choose_plan">
                            <div className='start_plan_name'>{t("settings.planName1")}</div>
                            <div className="start_plan_ammount_section" style={{ marginBottom: "145px" }}>
                                <div className="start_plan_ammount">{t("settings.planPrice1")}</div>
                            </div>

                            <div className="start_plan_button_section" >
                                {/* {loadingPage ?
                                                <SkeletonDisplayText size="large" maxWidth={`${30}ch`} />
                                                :
                                                <Button size='large' disabled={planName === "Free"} loading={isLoadingPlanButton} onClick={() => handlePlanSelect('Free')} variant='primary' fullWidth>
                                                    {planName == 'Free' ? 'selected' : 'select'}
                                                </Button>} */}
                            </div>
                            <div className="star_plan_limit_dialogue">
                                <ul className='start_plan_list'>
                                    <li className='start_plan_list_item'>- {t("settings.freeBenefit1")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.freeBenefit2")}</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="start_price_choose_plan">
                            <div className='start_plan_name'>{t("settings.planName2")}</div>
                            <div className="start_plan_ammount_section">
                                <div className="start_plan_ammount">19$</div>
                                <div className="start_plan_ammount_suffix">{t("settings.planPrice2")}</div>
                            </div>
                            <div className="start_plan_trial"><Badge size="small" tone="info">{t("settings.freeTrileText")}</Badge> </div>
                            <div className="start_plan_button_section">
                                {loadingPage ?
                                    <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                    :
                                    <Button loading={loadingPage} disabled={planName === 'Starter'} size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>
                                        {planName == 'Starter' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}

                                    </Button>}

                            </div>
                            <div className="star_plan_limit_dialogue">
                                <ul className='start_plan_list'>
                                    <li className='start_plan_list_item'>- {t("settings.starterBenefit1")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.starterBenefit2")}</li>
                                </ul>
                                {/* <div>Up to 10 abandoned carts per month</div> */}

                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="start_price_choose_plan">
                            <div className='start_plan_name'>{t("settings.planName3")}</div>
                            <div className="start_plan_ammount_section">
                                <div className="start_plan_ammount">49$</div>
                                <div className="start_plan_ammount_suffix">{t("settings.planPrice3")}</div>
                            </div>
                            <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                            <div className="start_plan_button_section">
                                {loadingPage ?
                                    <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                    :
                                    <Button loading={loadingPage} disabled={planName === 'Pro'} size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>
                                        {planName == 'Pro' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}
                                    </Button>}

                            </div>
                            <div className="star_plan_limit_dialogue">
                                <ul className='start_plan_list'>
                                    <li className='start_plan_list_item'>- {t("settings.proBenefit1")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.proBenefit2")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.proBenefit3")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.proBenefit4")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.proBenefit5")}</li>
                                </ul>
                                {/* <div>Up to 49 sales recovery carts per month</div> */}

                            </div>
                        </div>
                        <div className='popular_badge'>
                            {t("settings.popularBadgeText")}
                        </div>
                    </Card>
                    <Card>
                        <div className="start_price_choose_plan">
                            <div className='start_plan_name'>{t("settings.planName4")}</div>
                            <div className="start_plan_ammount_section">
                                <div className="start_plan_ammount">99$</div>
                                <div className="start_plan_ammount_suffix">{t("settings.planPrice4")}</div>
                            </div>
                            <div className="start_plan_trial"><Badge tone="info">{t("settings.freeTrileText")}</Badge> </div>
                            <div className="start_plan_button_section">

                                {loadingPage ?
                                    <SkeletonDisplayText size="large" maxWidth={`${40}ch`} />
                                    :
                                    <Button disabled={planName === 'Advance'} size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>
                                        {planName == 'Advance' ? t("settings.planSelectedText") : t("settings.planNotSelectedText")}
                                    </Button>}
                            </div>
                            <div className="star_plan_limit_dialogue">
                                <ul className='start_plan_list'>
                                    <li className='start_plan_list_item'>- {t("settings.advancedBenefit1")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.advancedBenefit2")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.advancedBenefit3")}</li>
                                    <li className='start_plan_list_item'>- {t("settings.advancedBenefit4")}</li>
                                </ul>
                                {/* <div>Up to 100 abandoned carts per month</div> */}

                            </div>
                        </div>

                    </Card>
                </div>
            </div>
        </div>
    )
}
