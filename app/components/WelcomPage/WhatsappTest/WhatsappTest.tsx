import { Button, Icon, TextField } from '@shopify/polaris';
import {
    ReplayIcon
} from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import Tooltip from '~/components/global/Tooltip/Tooltip';

function isValidPhoneNumber(number: any) {
    const regex = /^\+\d{1,3}\d{6,14}$/;
    return regex.test(number);
}

const COOLDOWN_SECONDS = 90;
const MAX_TESTS = 5;

export default function WhatsappTest({ shop }: any) {
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
            setNotification({ message: `You can retry sending another test in ${cooldown} seconds.`, type: 'error' });
            return;
        }

        const trimmed = (phone || '').trim();
        if (!isValidPhoneNumber(trimmed)) {
            setNotification({ message: 'Invalid phone number. Make sure it includes the + and country code.', type: 'error' });
            return;
        }

        if (testCount >= MAX_TESTS) {
            setNotification({ message: `Test limit reached. You have already tried ${MAX_TESTS} times.`, type: 'error' });
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
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setNotification({
                    message: errorData?.error || 'Something went wrong while sending message.',
                    type: 'error',
                });
                setSendButtonDisabled(false);
                return;
            }

            setTestCount((p) => p + 1);
            localStorage.setItem(`whatsappTest_${shop}`, JSON.stringify({ lastTestTime: Date.now() }));
            setNotification({ message: 'Test message sent! You’ll receive it on WhatsApp shortly.', type: 'success' });
            setCooldown(COOLDOWN_SECONDS);
        } catch (err) {
            console.error('error occured on handleSendTest', err);
            setNotification({ message: 'Something went wrong while sending message, please try again later', type: 'error' });
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
                    Test WhatsApp message
                </p>
                <Tooltip>
                    <div>Send a test WhatsApp message to see how it looks.</div>
                    <div>Enter your phone number</div>
                    <div>(Include the country code starting with +).</div>
                </Tooltip>
            </div>
            <div className='flex flex-row text-center gap-3 phone-input-wrapper'>
                <TextField
                    type="text"
                    label=""
                    value={phone}
                    placeholder="Enter your phone number"
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
                        Send Test
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
                        {cooldown > 0 && notification.type !== 'success' ? `You can retry sending another test in ${cooldown} seconds.` : notification.message}
                    </p>
                </div>
            )}

        </div >
    )
}
