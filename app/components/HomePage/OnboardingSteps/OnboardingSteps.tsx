import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { XIcon, AppsIcon } from '@shopify/polaris-icons';
import './OnboardingSteps.css';
import { useNavigate, useOutletContext } from '@remix-run/react';
import { manageOnboarding } from '~/lib/onboarding/common';
import { isProPlanOrHigher } from '~/utils/plans';
import Tick from './SVG/Tick';
import InactiveBadge from './SVG/InactiveBadge';
import ActiveBadge from './SVG/ActiveBadge';

export default function OnboardingSteps({ shop, t, setChatEmbedEnabled }: any) {
    const navigate = useNavigate();
    const [openStepKey, setOpenStepKey] = useState<string[]>([]);
    const { selectedPlanName, permissions }: any = useOutletContext()
    const [onboarding, setOnboarding] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);

    const handleWhatsAppToggle = useCallback(() => { }, []);
    const handleAiBotToggle = useCallback(() => { }, []);

    const handleDismiss = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const handleUndo = useCallback(() => {
        setIsDismissed(false);
    }, []);

    const handlePermanentRemove = useCallback(() => {
        setIsRemoved(true);
        manageOnboarding({ data: { hideOnboarding: true }, shop });
    }, [shop]);

    const toggleStep = useCallback((key: string) => {
        setOpenStepKey(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    }, []);

    const STEP_CONFIG = useMemo(() => [
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
    ], [t]);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const initializeOnboarding = async () => {
            try {
                // fetching onboarding data first (faster than embed status which requires theme API calls)
                const controller = new AbortController();
                const timeoutHandle = setTimeout(() => controller.abort(), 3000); // 3s timeout
                
                const onboardingResponse = await fetch('/api/firestore?collectionName=onboardingProgress', { 
                    signal: controller.signal 
                });
                clearTimeout(timeoutHandle);
                
                const onboardingData = await onboardingResponse.json();

                if (!isMounted) return;

                let dataToSet = onboardingData?.data;

                // if no data exists, creating it but not waiting for it - using default data
                if (!dataToSet || Object.keys(dataToSet).length === 0) {
                    dataToSet = {
                        hideOnboarding: false,
                        step1: { connectWhatsapp: false, editMessage: false, sendTestMessage: false },
                        step2: { startSync: false, chooseTone: false, installPreview: false }
                    };
                    
                    // creaing data in background without blocking UI
                    fetch('/api/onboarding_create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    }).catch(err => console.error('Background onboarding creation failed:', err));
                }

                if (!isMounted) return;

                // setting initial state immediately with onboarding data only
                setOnboarding(dataToSet);
                setIsRemoved(dataToSet?.hideOnboarding || false);
                initFirstIncompleteStep(dataToSet);
                
                // setting loading to false to show UI immediately
                setIsLoading(false);

                // fetching embed status in the background (non-blocking) with timeout
                // This can take up to 2-3 seconds due to Shopify API calls
                const embedController = new AbortController();
                const embedTimeout = setTimeout(() => embedController.abort(), 2500);
                
                fetch('/api/getEmbedStatus', { signal: embedController.signal })
                    .then(res => res.json())
                    .then(embedData => {
                        clearTimeout(embedTimeout);
                        if (!isMounted) return;
                        
                        const resEmbedEnabled = !embedData.embedDisabled;
                        setChatEmbedEnabled(resEmbedEnabled);
                        
                        // updating onboarding data if embed status differs
                        if (resEmbedEnabled !== dataToSet?.step2?.installPreview) {
                            const updatedData = {
                                ...dataToSet,
                                step2: { ...dataToSet?.step2, installPreview: resEmbedEnabled }
                            };
                            setOnboarding(updatedData);
                            manageOnboarding({ data: { step2: { installPreview: resEmbedEnabled } }, shop });
                        }
                    })
                    .catch(err => {
                        clearTimeout(embedTimeout);
                        console.error('Error fetching embed status:', err);
                        setChatEmbedEnabled(false);
                    });

            } catch (err) {
                console.error('Error initializing onboarding:', err);
                if (isMounted) {
                    setOnboarding({ step1: {}, step2: {} });
                    setIsLoading(false);
                }
            }
        };

        initializeOnboarding();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [shop]);

    const completedCount = useMemo(() => {
        return onboarding
            ? [
                onboarding.step1?.connectWhatsapp,
                onboarding.step1?.editMessage,
                onboarding.step1?.sendTestMessage,
                onboarding.step2?.chooseTone,
                onboarding.step2?.installPreview,
                onboarding.step2?.startSync
            ].filter(Boolean).length
            : 0;
    }, [onboarding]);

    const progress = useMemo(() => (completedCount / 6) * 100, [completedCount]);

    const renderIcon = useCallback((done: any) =>
        done ? <div className="step-done-icon"><Tick />
        </div> : <div className="custom-step-icon" />, []);

    const navigateToStep = useCallback((link: any) => {
        navigate(link);
    }, [navigate]);

    const initFirstIncompleteStep = useCallback((data: any) => {
        const stepsInOrder = [
            ...STEP_CONFIG[0].steps.map(s => s.key),
            ...STEP_CONFIG[1].steps.map(s => s.key),
        ];

        const firstIncompleteKey = stepsInOrder.find(
            key =>
                data?.step1?.[key] === false ||
                data?.step2?.[key] === false
        );

        if (firstIncompleteKey) {
            setOpenStepKey([firstIncompleteKey]);
        }
    }, [STEP_CONFIG]);

    const renderStepGroup = useCallback(({ groupId, title, steps, data, isOpen, toggleAccordion, pro = false, isStepsNotDone }: any) => {
        const safeData = data || {};

        return (
            <>
                <Divider />
                <div className="accordion-trigger" onClick={toggleAccordion}>
                    <Box padding="300">
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="200">
                                <div className="acc_ttl">
                                    {renderIcon(!isStepsNotDone)}  <Text as="p" variant="bodyMd">{title}</Text>
                                </div>
                                {pro && <Badge tone="info">{t("settings.planName3")}</Badge>}
                            </InlineStack>
                            {/* <div>
                                <Icon
                                    source={isOpen ? ChevronUpIcon : ChevronDownIcon}
                                    tone="subdued"
                                />
                            </div> */}
                        </InlineStack>
                    </Box>
                </div>

                <Collapsible open={isOpen} id={groupId}>
                    <Box padding="400" paddingBlockStart="150">
                        <BlockStack gap="400">
                            {steps.map((s: any, i: any) => {
                                const done = safeData[s.key];
                                const isHighlighted = openStepKey.includes(s.key);

                                if (isHighlighted) {
                                    return (
                                        <Box key={s.key} background="bg-surface-secondary" borderRadius="200">
                                            <div className="step-card">
                                                <div className="step-row current-step-row" onClick={() => toggleStep(s.key)}>
                                                    {renderIcon(done)}
                                                    <div className="step-content">
                                                        <div className="step-title-row">
                                                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                                                                {s.title}
                                                            </Text>
                                                        </div>
                                                        {s.description && (
                                                            <Text as="p" variant="bodySm" tone="subdued">
                                                                {s.description}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                                {((s.key === "installPreview" || s.key === "startSync" || s.key === "connectWhatsapp") || (!done && s.actionLabel)) && (
                                                    <div className="action-btn step-card-action">
                                                        <div className="step-card-controls">
                                                            {(s.key === "installPreview" || s.key === "startSync" || s.key === "connectWhatsapp") && (
                                                                <span className="badge-wrapper step-status-badge">
                                                                    {done ? <ActiveBadge className="active-badge" /> : <InactiveBadge className="inactive-badge" />}
                                                                </span>
                                                            )}
                                                            {!done && s.actionLabel && (
                                                                <Button disabled={s.pro ? (!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)) : false} variant="primary" onClick={() => navigateToStep(s.actionLink)}>{s.actionLabel}</Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Box>
                                    );
                                }

                                return (
                                    <div
                                        className="step-row"
                                        key={s.key}
                                        onClick={() => toggleStep(s.key)}
                                    >
                                        {renderIcon(done)}
                                        <div className="step-content step-content-inline">
                                            <Text as="p" variant="bodyMd" tone="subdued">
                                                {s.title}
                                            </Text>
                                        </div>
                                        {(s.key === "installPreview" || s.key === "startSync" || s.key === "connectWhatsapp") && (
                                            <span className="badge-wrapper step-status-badge">
                                                {done ? <ActiveBadge className="active-badge" /> : <InactiveBadge className="inactive-badge" />}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </BlockStack>
                    </Box>
                </Collapsible>
            </>
        );
    }, [STEP_CONFIG, renderIcon, openStepKey, toggleStep, selectedPlanName, permissions, navigateToStep, t]);

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
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingSm" as="h2">{t("homePostPayment.setCartKeeper")}</Text>
                                            <Button
                                                icon={XIcon}
                                                variant="plain"
                                                onClick={handleDismiss}
                                                accessibilityLabel="Dismiss setup guide"
                                            />
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
                                        isStepsNotDone: group.id === "step1" ? Object.values(onboarding?.step1 || {}).some(v => !v) : Object.values(onboarding?.step2 || {}).some(v => !v),
                                        steps: group.steps,
                                        data: onboarding ? onboarding[group.id] : {},
                                        isOpen: group.id === "step1" ? true : true,
                                        toggleAccordion: group.id === "step1" ? handleWhatsAppToggle : handleAiBotToggle,
                                        pro: group.pro
                                    })
                                )}
                            </Card>
                        )
                    )}
                    <Card>
                        <div className="embed-card">
                            <div className="embed-card-main">
                                <div className="embed-card-icon">
                                    <Icon source={AppsIcon} tone="base" />
                                </div>
                                <div className="embed-card-content">
                                    <div className="embed-card-title-row">
                                        <Text as="p" variant="bodyMd" fontWeight="medium">{t("homePostPayment.embedTitle")}</Text>
                                        <Badge tone="info">{t("settings.planName3")}</Badge>
                                        <span className="badge-wrapper step-status-badge">
                                        {onboarding?.step2?.installPreview ? <ActiveBadge className="active-badge" /> : <InactiveBadge className="inactive-badge" />}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="embed-card-action">
                                {onboarding?.step2?.installPreview ?
                                <Button disabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))} onClick={() => navigate('/app/AIChatbot')}>{t("aiSettings.turnOff")}</Button>
                                :
                                <Button disabled={(!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan))} onClick={() => navigate('/app/AIChatbot')}>{t("aiSettings.turnOn")}</Button>
                                }
                            </div>
                        </div>
                    </Card>

                </BlockStack>
            )}

        </>
    );
}
