import { Banner } from '@shopify/polaris';
import { useEffect, useState } from 'react';

export default function BannerInfo({ isPlanSelected, isChatEmbedEnabled, t }: any) {
    const [hideAppSetupBanner, setHideAppSetupBanner] = useState(false);
    const [hideChatbotBanner, setHideChatbotBanner] = useState(false);
    const [hideMessageBanner, setHideMessageBanner] = useState(false);

    const isFullyConfigured = isPlanSelected && isChatEmbedEnabled;

    useEffect(() => {
        setHideChatbotBanner(
            localStorage.getItem("ck-hide-chatbot-banner") === "true"
        );
        setHideMessageBanner(
            localStorage.getItem("ck-hide-message-banner") === "true"
        );
        setHideAppSetupBanner(
            localStorage.getItem("ck-hide-app-setup-banner") === "true"
        );
    }, []);

    return (
        <div>
            {isFullyConfigured && !hideChatbotBanner && (
                <div className="mb-6">
                    <Banner
                        title={t("homePostPayment.infoBanner.chatbotInstalledThemeTitle")}
                        onDismiss={() => {
                            setHideChatbotBanner(true);
                            localStorage.setItem("ck-hide-chatbot-banner", "true");
                        }}
                    >
                        <p>{t("homePostPayment.infoBanner.descriptionChatbotSetup")}</p>
                    </Banner>
                </div>
            )}

            {!isFullyConfigured && !hideAppSetupBanner && (
                <div className="mb-6">
                    <Banner
                        title={t("homePostPayment.infoBanner.messageSendingAutoTitle")}
                        onDismiss={() => {
                            setHideAppSetupBanner(true);
                            localStorage.setItem("ck-hide-app-setup-banner", "true");
                        }}
                    >
                        <p>{t("homePostPayment.infoBanner.descriptionAppSetup")}</p>
                    </Banner>
                </div>
            )}

            {isFullyConfigured && !hideMessageBanner && (
                <div className="mb-6">
                    <Banner
                        title={t("homePostPayment.infoBanner.messageSendingAutoTitle")}
                        onDismiss={() => {
                            setHideMessageBanner(true);
                            localStorage.setItem("ck-hide-message-banner", "true");
                        }}
                    >
                        <p>{t("homePostPayment.infoBanner.descriptionWhatsappSetup")}</p>
                    </Banner>
                </div>
            )}
        </div>
    );
}
