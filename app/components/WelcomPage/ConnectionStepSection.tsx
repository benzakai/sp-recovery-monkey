import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, Text } from "@shopify/polaris";

import LinkDeviceStepSVG from "./SVGs/LinkDeviceStepSVG";
import WhatsAppSettingsStepSVG from "./SVGs/WhatsAppSettingsStepSVG";
import ScanQRStepSVG from "./SVGs/ScanQRStepSVG";
import Arrow1SVG from "./SVGs/Arrow1SVG";
import Arrow2SVG from "./SVGs/Arrow2SVG";
import OneSVG from "../SVGs/OneSVG";
import TwoSVG from "../SVGs/TwoSVG";
import ThreeSVG from "../SVGs/ThreeSVG";
import PopUp from "../PopUp";

export default function ConnectionStepSection() {
    const { t } = useTranslation();

    const handleOpenModal = () => {
        shopify.modal.show("whatsapp_connect_tutorial_modal")
    }

    const handleCloseModal = () => {
        shopify.modal.hide("whatsapp_connect_tutorial_modal")
    }

    const [getCards] = React.useState([
        {
            id: 1,
            stepIcon: <OneSVG />,
            icon: <WhatsAppSettingsStepSVG />,
            title: t("dashboard.connectionSteps.openSettings"),
            description: t("dashboard.connectionSteps.tapDots"),
            nextStepIcon: <Arrow1SVG />,
        },
        {
            id: 2,
            stepIcon: <TwoSVG />,
            icon: <LinkDeviceStepSVG />,
            title: t("dashboard.connectionSteps.linkDevice"),
            description: t("dashboard.connectionSteps.selectDevice"),
            nextStepIcon: <Arrow2SVG />,
        },
        {
            id: 3,
            stepIcon: <ThreeSVG />,
            icon: <ScanQRStepSVG />,
            title: t("dashboard.connectionSteps.scanBarcode"),
            description: t("dashboard.connectionSteps.getQr"),
            nextStepIcon: null,
        },
    ]);

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-solid p-4 md:p-6">
                <div className="pb-2 text-center md:text-left">
                    <p className="text-[13px] font-semibold">
                        {t("dashboard.connectionSteps.title")}
                    </p>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-[13px]">
                        {t("dashboard.connectionSteps.description")}
                    </p>
                </div>

                <div className="abandoned-block flex flex-col lg:flex-row md:flex-row items-center lg:items-start pt-6 pb-8 font-inter welcome_wrapper">
                    {getCards.map((card, index) => (
                        <div
                            key={card.id}
                            className="flex flex-col lg:flex-row md:flex-row items-center w-full lg:w-auto"
                        >
                            <div className="flex flex-col justify-center items-center text-center m-4 welcome_wrapper_content w-full lg:w-auto">
                                <div className="mb-2">{card.icon}</div>
                                <div className="flex flex-row items-center gap-2 mb-2">
                                    <div className="w-6 h-6 md:w-8 md:h-8 lg:w-8 lg:h-8 flex items-center justify-center">
                                        {React.cloneElement(card.stepIcon, {
                                            width: "100%",
                                            height: "100%",
                                        })}
                                    </div>
                                    <div className="step-desc-wrap">
                                        <div className="font-semibold text-base md:text-lg lg:text-xl pb-1 steps-txt">
                                            {card.title}
                                        </div>
                                            <div className="text-[13px] text-[#6B7177]">
                                            {card.description}
                                        </div>
                                    </div>
                                </div>
                                
                            </div>

                            {card.nextStepIcon && index < getCards.length - 1 && (
                                <div className="my-4 xl:my-0 xl:mx-4 rotate-90 xl:rotate-0 hidden xl:block">
                                    {card.nextStepIcon}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center md:text-left">
                    <p className="text-[13px]">
                        {t("dashboard.connectionSteps.watchTutorial")} –{" "}
                        <Link removeUnderline onClick={handleOpenModal}>
                            {t("dashboard.connectionSteps.watchHere")}
                        </Link>
                    </p>
                </div>
                <PopUp
                    id={"whatsapp_connect_tutorial_modal"}
                    component={<div
                        className="flex justify-center align-middle p-5"
                    >
                        <iframe
                            src="https://www.youtube.com/embed/f3Z_M0B8Nqo"
                            title={t("dashboard.connectionSteps.videoTitle")}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-[1000px] h-[650px] max-w-full rounded-xl border-0"
                        ></iframe>
                    </div>}
                    handleSecondaryAction={handleCloseModal}
                    isShowPrimaryButton={false}
                    isShowSecondaryButton={false}
                    secondaryButtonText={"Close"}
                />
            </div>
        </>
    );
}
