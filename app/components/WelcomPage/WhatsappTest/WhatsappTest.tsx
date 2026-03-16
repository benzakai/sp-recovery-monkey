import { Button, Icon, TextField } from '@shopify/polaris';
import {
    ReplayIcon
} from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import Tooltip from '~/components/global/Tooltip/Tooltip';
import { manageOnboarding } from '~/lib/onboarding/common';

function isValidPhoneNumber(number: any) {
    const regex = /^\+\d{1,3}\d{6,14}$/;
    return regex.test(number);
}

function formatCooldown(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;

    return `${secs}s`;
}

const COOLDOWN_SECONDS = 24 * 60 * 60;
const MAX_TESTS = 5;

export default function WhatsappTest({ shop, t, page, message }: any) {
    const [phone, setPhone] = useState<string>('');
    const [isSendButtonDisabled, setSendButtonDisabled] = useState(false);
    const [cooldown, setCooldown] = useState<number>(0);
    const [testCount, setTestCount] = useState<number>(0);
    const [notification, setNotification] = useState<{ message: string; type: string }>({ message: '', type: '' });
    const [showRefresh, setShowRefresh] = useState(false);

    const fetchWhatsappTestData = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=whatsappTests');
            const Responsedata = await response.json();
            if (Responsedata.data) {
                setTestCount(Responsedata.data.testCount || 0);
            }
        } catch (error) {
            console.log('error occured on fetchWhatsappTestData', error);
        }
    };

    useEffect(() => {
        fetchWhatsappTestData();

        const saved = JSON.parse(localStorage.getItem(`whatsappTest_${shop}`) || 'null');
        if (saved && saved.lastTestTime) {
            const now = Date.now();
            const diff = Math.floor((now - saved.lastTestTime) / 1000);
            if (diff < COOLDOWN_SECONDS) {
                setCooldown(COOLDOWN_SECONDS - diff);
                setSendButtonDisabled(true);
                setShowRefresh(true);
            }
        }
    }, [shop]);

    useEffect(() => {
        if (notification.type === 'success') {
            const timer = setTimeout(() => {
                setNotification({ message: '', type: '' });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [notification]);


    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (cooldown === 0 && isSendButtonDisabled) {
            // setSendButtonDisabled(false);
            setShowRefresh(true);
        }
    }, [cooldown, isSendButtonDisabled]);

    const handleSendTest = async () => {
        if (cooldown > 0) {
            setNotification({ message: t('global.whatsappTest.retryMessage', { cooldown }), type: 'error' });
            return;
        }

        const trimmed = (phone || '').trim();
        if (!isValidPhoneNumber(trimmed)) {
            setNotification({ message: t('global.whatsappTest.invalidPhone'), type: 'error' });
            return;
        }

        if (testCount >= MAX_TESTS) {
            setNotification({ message: t('global.whatsappTest.testLimit', { MAX_TESTS }), type: 'error' });
            return;
        }

        setSendButtonDisabled(true);
        setShowRefresh(true);

        try {
            const response = await fetch('/api/saveWhatsappTest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionName: 'whatsappTests',
                    documentName: shop,
                    data: {
                        testCount: testCount + 1,
                        lastTestTime: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    },
                    phone: trimmed,
                    shop,
                    message,
                    page
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setNotification({
                    message: errorData?.error || t('global.whatsappTest.errorSendingMessage'),
                    type: 'error',
                });
                setSendButtonDisabled(false);
                return;
            }
            manageOnboarding({ data: { step1: { sendTestMessage: true } }, shop });
            setTestCount((p) => p + 1);
            localStorage.setItem(`whatsappTest_${shop}`, JSON.stringify({ lastTestTime: Date.now() }));
            setNotification({ message: t('global.whatsappTest.successSendingMessage'), type: 'success' });
            setCooldown(COOLDOWN_SECONDS);
        } catch (err) {
            console.error('error occured on handleSendTest', err);
            setNotification({ message: t('global.whatsappTest.errorSendingMessageLater'), type: 'error' });
            setSendButtonDisabled(false);
        }
    };

    const handlePhoneNumberChange = (value: string) => {
        if (notification.message) setNotification({ message: '', type: '' });
        setPhone(value);
    };

    const handleRefreshClick = () => {
        if (cooldown > 0) return;
        setSendButtonDisabled(false);
        setNotification({ message: '', type: '' });
    };

    const isButtonEnabled = () => {
        return !isSendButtonDisabled && cooldown === 0 && (phone?.replace(/\D/g, '')?.length ?? 0) > 3;
    };

    return (
        <div className='mt-2 flex flex-col text-center md:text-left'>
            <div className='flex flex-row mt-3 mb-2 gap-2 items-center'>
                <p className="text-[13px] font-semibold">
                    {t('global.whatsappTest.testMessage')}
                </p>
                <Tooltip>
                    <div>{t('global.whatsappTest.howItLooks')}</div>
                    <div>{t('global.whatsappTest.enterPhoneNumber')}</div>
                    <div>({t('global.whatsappTest.includeCountryCode')}).</div>
                </Tooltip>
            </div>
            <div className='flex flex-row text-center gap-3 phone-input-wrapper'>
                <TextField
                    type="text"
                    label=""
                    value={phone}
                    placeholder={t('global.whatsappTest.enterPhoneNumber')}
                    onChange={handlePhoneNumberChange}
                    autoComplete="tel"
                />
                <div className='flex flex-row gap-2'>
                    <Button
                        size="large"
                        variant="primary"
                        disabled={!isButtonEnabled()}
                        onClick={handleSendTest}
                    >
                        {t('global.whatsappTest.sendTest')}
                    </Button>

                    {showRefresh && (
                        <div
                            className={`my-auto font-bold ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={handleRefreshClick}
                            role="button"
                            aria-label="refresh"
                            tabIndex={0}
                        >
                            <Icon source={ReplayIcon} />
                        </div>
                    )}
                </div>
            </div>

            {(notification.message || cooldown > 0 && notification.type !== 'success') && (
                <div>
                    <p
                        className={`text-sm mt-3 ${(notification.type === "error" || cooldown > 0 && notification.type !== 'success') ? "text-red-600" : "text-green-600"
                            }`}
                    >
                        {cooldown > 0 && notification.type !== 'success' ? t('global.whatsappTest.retryMessage', { cooldown: formatCooldown(cooldown) }) : notification.message}
                    </p>
                </div>
            )}

        </div >
    )
}
