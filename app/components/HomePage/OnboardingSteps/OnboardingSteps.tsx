import React, { useState, useCallback, useEffect } from 'react';
import {
    Card,
    Text,
    ProgressBar,
    BlockStack,
    InlineStack,
    Button,
    Collapsible,
    Icon,
    Badge,
    Box,
    Divider,
    Spinner
} from '@shopify/polaris';
import { ChevronUpIcon, ChevronDownIcon, XIcon, AppsIcon, StatusActiveIcon } from '@shopify/polaris-icons';
import './OnboardingSteps.css';
import { useNavigate, useOutletContext } from '@remix-run/react';
import { manageOnboarding } from '~/lib/onboarding/common';
import { isProPlanOrHigher } from '~/utils/plans';

export default function OnboardingSteps({ shop, t }: any) {
    const navigate = useNavigate();
    const { selectedPlanName, permissions }: any = useOutletContext()
    const [whatsAppOpen, setWhatsAppOpen] = useState(true);
    const [aiBotOpen, setAiBotOpen] = useState(false);
    const [onboarding, setOnboarding] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isDismissed, setIsDismissed] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);

    const handleWhatsAppToggle = useCallback(() => setWhatsAppOpen((prev) => !prev), []);
    const handleAiBotToggle = useCallback(() => setAiBotOpen((prev) => !prev), []);

    const handleDismiss = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const handleUndo = useCallback(() => {
        setIsDismissed(false);
    }, []);

    const handlePermanentRemove = useCallback(() => {
        setIsRemoved(true);
        manageOnboarding({ data: { hideOnboarding: true }, shop });
    }, []);

    useEffect(() => {
        fetchOnboardingData();
    }, []);

    const STEP_CONFIG = [
        {
            id: "step1",
            title: t("homePostPayment.onboardingSteps.step1.title"),
            steps: [
                {
                    key: "connectWhatsapp",
                    title: t("homePostPayment.onboardingSteps.step1.connectWhatsapp.title"),
                    description: t("homePostPayment.onboardingSteps.step1.connectWhatsapp.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step1.connectWhatsapp.actionLabel"),
                    actionLink: "/app/WelcomeConnect#connectSection"
                },
                {
                    key: "editMessage",
                    title: t("homePostPayment.onboardingSteps.step1.editMessage.title"),
                    description: t("homePostPayment.onboardingSteps.step1.editMessage.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step1.editMessage.actionLabel"),
                    actionLink: "/app/WelcomeConnect"
                },
                {
                    key: "sendTestMessage",
                    title: t("homePostPayment.onboardingSteps.step1.sendTestMessage.title"),
                    description: t("homePostPayment.onboardingSteps.step1.sendTestMessage.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step1.sendTestMessage.actionLabel"),
                    actionLink: "/app/WelcomeConnect"
                }
            ]
        },
        {
            id: "step2",
            title: t("homePostPayment.onboardingSteps.step2.title"),
            pro: true,
            steps: [
                {
                    key: "startSync",
                    title: t("homePostPayment.onboardingSteps.step2.startSync.title"),
                    description: t("homePostPayment.onboardingSteps.step2.startSync.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step2.startSync.actionLabel"),
                    actionLink: "/app/AIChatbot",
                    pro: true
                },
                {
                    key: "chooseTone",
                    title: t("homePostPayment.onboardingSteps.step2.chooseTone.title"),
                    description: t("homePostPayment.onboardingSteps.step2.chooseTone.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step2.chooseTone.actionLabel"),
                    actionLink: "/app/AIChatbot",
                    pro: true
                },
                {
                    key: "installPreview",
                    title: t("homePostPayment.onboardingSteps.step2.installPreview.title"),
                    description: t("homePostPayment.onboardingSteps.step2.installPreview.description"),
                    actionLabel: t("homePostPayment.onboardingSteps.step2.installPreview.actionLabel"),
                    actionLink: "/app/AIChatbot",
                    pro: true
                }
            ]
        }
    ];

    const saveOnboardingData = async () => {
        try {
            const response = await fetch('/api/onboarding_create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                throw new Error('failed to save onboarding data');
            }
        } catch (error) {
            console.error('error saving onboarding data:', error);
        }
    }

    const fetchOnboardingData = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=onboardingProgress');
            const res = await response.json();
            console.log("res.data", res.data);
            if (res?.data && Object.keys(res.data).length > 0) {
                setOnboarding(res.data);
                setIsRemoved(res.data.hideOnboarding);
                const isWhatsAppStepsNotDone = Object.values(res.data.step1).some(v => !v);
                setWhatsAppOpen(isWhatsAppStepsNotDone);
                const isAiStepsNotDone = Object.values(res.data.step2).some(v => !v);
                if (!isWhatsAppStepsNotDone) {
                    setAiBotOpen(isAiStepsNotDone);
                }
                console.log("res.data.step2.installPreview", res.data.step2.installPreview);
                await checkEmbedDisabled(res.data.step2.installPreview);
            } else {
                await saveOnboardingData();
                await fetchOnboardingData();
            }
        } catch (err) {
            console.error(err);
            setOnboarding({ step1: {}, step2: {} });
        } finally {
            setIsLoading(false);
        }
    };

    const checkEmbedDisabled = async (installPreviewEnabled: boolean) => {
        try {
            const response = await fetch('/api/getEmbedStatus');
            const res = await response.json();
            const resEmbedEnabled = !res.embedDisabled
            if (resEmbedEnabled !== installPreviewEnabled) {
                manageOnboarding({ data: { step2: { installPreview: resEmbedEnabled } }, shop });
                setOnboarding((prev: any) => ({
                    ...prev,
                    step2: { ...prev.step2, installPreview: resEmbedEnabled }
                }));
            }
        } catch (error) {
            console.log("error occured on checkEmbedDisabled", error);
        }
    }

    const completedCount = onboarding
        ? [
            onboarding.step1?.connectWhatsapp,
            onboarding.step1?.editMessage,
            onboarding.step1?.sendTestMessage,
            onboarding.step2?.chooseTone,
            onboarding.step2?.installPreview,
            onboarding.step2?.startSync
        ].filter(Boolean).length
        : 0;

    const progress = (completedCount / 6) * 100;

    const renderIcon = (done: any) =>
        done ? <div className="step-done-icon">✔</div> : <div className="custom-step-icon" />;

    const navigateToStep = (link: any) => {
        navigate(link);
    };

    const renderStepGroup = ({ groupId, title, steps, data, isOpen, toggleAccordion, pro = false }: any) => {
        const safeData = data || {};
        const firstIncompleteIndex = steps.findIndex((s: any) => !safeData[s.key]);


        return (
            <>
                <Divider />
                <div className="accordion-trigger" onClick={toggleAccordion}>
                    <Box padding="300">
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="200">
                                <div className="acc_ttl">
                                    <Text as="p" variant="bodyMd">{title}</Text>
                                </div>
                                {pro && <Badge tone="info">{t("settings.planName3")}</Badge>}
                            </InlineStack>
                            <div>
                                <Icon
                                    source={isOpen ? ChevronUpIcon : ChevronDownIcon}
                                    tone="subdued"
                                />
                            </div>
                        </InlineStack>
                    </Box>
                </div>

                <Collapsible open={isOpen} id={groupId}>
                    <Box padding="400" paddingBlockStart="150">
                        <BlockStack gap="400">
                            {steps.map((s: any, i: any) => {
                                const done = safeData[s.key];
                                const isHighlighted = i === firstIncompleteIndex;

                                if (isHighlighted) {
                                    return (
                                        <Box key={s.key} background="bg-surface-secondary" borderRadius="200">
                                            <InlineStack align="space-between" blockAlign="center" gap="400">
                                                <div className="step-row current-step-row">
                                                    {renderIcon(done)}
                                                    <BlockStack gap="100">
                                                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                                                            {s.title}
                                                        </Text>
                                                        {s.description && (
                                                            <Text as="p" variant="bodySm" tone="subdued">
                                                                {s.description}
                                                            </Text>
                                                        )}
                                                    </BlockStack>
                                                </div>

                                                {!done && s.actionLabel && (
                                                    <div className="action-btn">
                                                        <Button disabled={s.pro ? (!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)) : false} variant="primary" onClick={() => navigateToStep(s.actionLink)}>{s.actionLabel}</Button>
                                                    </div>
                                                )}
                                            </InlineStack>
                                        </Box>
                                    );
                                }

                                return (
                                    <div className="step-row" key={s.key}>
                                        {renderIcon(done)}
                                        <Text as="p" variant="bodyMd" tone="subdued">
                                            {s.title}
                                        </Text>
                                    </div>
                                );
                            })}
                        </BlockStack>
                    </Box>
                </Collapsible>
            </>
        );
    };

    return (
        <>

            {isLoading ? (
                <div className="flex justify-center items-center h-full min-h-56 w-full">
                    <Spinner accessibilityLabel="Loading" size="large" />
                </div>
            ) : (
                <BlockStack gap="400">
                    {!isRemoved && (
                        isDismissed ? (
                            <Card>
                                <Box padding="200">
                                    <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="start">
                                            <Text as="h3" variant="headingSm" fontWeight="semibold">
                                                {t("homePostPayment.cardWillBeRemoved")}
                                            </Text>
                                            <div style={{ margin: '-8px -8px 0 0' }}>
                                                <Button
                                                    icon={XIcon}
                                                    variant="plain"
                                                    onClick={handlePermanentRemove}
                                                    accessibilityLabel="Remove permanently"
                                                />
                                            </div>
                                        </InlineStack>
                                        <Text as="p" tone="subdued">
                                            {t("homePostPayment.cardWillBeRemovedDescription")}
                                        </Text>
                                        <div>
                                            <Button variant="plain" onClick={handleUndo}>
                                                {t("homePostPayment.undo")}
                                            </Button>
                                        </div>
                                    </BlockStack>
                                </Box>
                            </Card>
                        ) : (
                            <Card padding="0">
                                <Box padding="400">
                                    <BlockStack gap="200">
                                        <InlineStack align="space-between" blockAlign="start">
                                            <Text variant="headingSm" as="h2">{t("homePostPayment.setCartKeeper")}</Text>
                                            <div style={{ margin: '-8px -8px 0 0' }}>
                                                <Button
                                                    icon={XIcon}
                                                    variant="plain"
                                                    onClick={handleDismiss}
                                                    accessibilityLabel="Dismiss setup guide"
                                                />
                                            </div>
                                        </InlineStack>

                                        <Text as="p" tone="subdued">
                                            <div className='subhead'>
                                                {t("homePostPayment.setCartKeeperDescription")}
                                            </div>
                                        </Text>

                                        <BlockStack gap="200" align="space-between">
                                            <div className="progress_bar">
                                                <div className='progress_txt'>
                                                    <Text as="p" tone="subdued">
                                                        {t("homePostPayment.progress", {
                                                            completedCount: completedCount,
                                                        })}
                                                    </Text>
                                                </div>
                                                <ProgressBar progress={progress} size="small" tone="primary" />
                                            </div>
                                        </BlockStack>
                                    </BlockStack>
                                </Box>

                                {STEP_CONFIG.map((group, index) =>
                                    renderStepGroup({
                                        groupId: group.id,
                                        title: group.title,
                                        steps: group.steps,
                                        data: onboarding ? onboarding[group.id] : {},
                                        isOpen: group.id === "step1" ? whatsAppOpen : aiBotOpen,
                                        toggleAccordion: group.id === "step1" ? handleWhatsAppToggle : handleAiBotToggle,
                                        pro: group.pro
                                    })
                                )}
                            </Card>
                        )
                    )}
                    <Card>
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Icon source={AppsIcon} tone="base" />
                                </div>
                                <InlineStack gap="200" blockAlign="center">
                                    <Text as="p" variant="bodyMd" fontWeight="medium">{t("homePostPayment.embedTitle")}</Text>
                                    <Badge tone="info">{t("settings.planName3")}</Badge>
                                </InlineStack>
                            </InlineStack>
                            {onboarding?.step2?.installPreview ?
                                <Button disabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))} onClick={() => navigate('/app/AIChatbot')}>{t("aiSettings.turnOff")}</Button>
                                :
                                <Button disabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))} onClick={() => navigate('/app/AIChatbot')}>{t("aiSettings.turnOn")}</Button>
                            }
                        </InlineStack>
                    </Card>

                </BlockStack>
            )}

        </>
    );
}


