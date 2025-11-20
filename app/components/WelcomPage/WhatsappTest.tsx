import { Button, Icon, Text, TextField, Tooltip } from '@shopify/polaris'
import {
    InfoIcon
} from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import {
    ReplayIcon
} from '@shopify/polaris-icons';

function isValidPhoneNumber(number: any) {
    const regex = /^\+\d{1,3}\d{6,14}$/;
    return regex.test(number);
}

const COOLDOWN_SECONDS = 90;
const MAX_TESTS = 5;

export default function WhatsappTest({ shop }: any) {
    const [phone, setPhone] = useState<any>()
    const [isSendButtonDisabled, setSendButtonDisabled] = useState(false)
    const [refreshButton, setRefreshButton] = useState({
        isShow: false,
        isDisabled: false
    })
    const [notification, setNotification] = useState({
        message: '',
        type: ''
    })
    const [testCount, setTestCount] = useState(0)
    const [cooldown, setCooldown] = useState(0)

    const fetchWhatsappTestData = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=whatsappTests', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const Responsedata = await response.json();
            if (Responsedata.data) {
                const data = Responsedata.data;
                setTestCount(data.testCount || 0)
            }
        } catch (error) {
            console.log("error occured on fetchWhatsappTestData", error)
        }
    }

    useEffect(() => {
        fetchWhatsappTestData()
        const savedData = JSON.parse(localStorage.getItem(`whatsappTest_${shop}`));
        // console.log("savedData============>>>", savedData)
        if (savedData) {
            const now = Date.now();
            const diff = Math.floor((now - savedData.lastTestTime) / 1000);
            // console.log("Time difference:", diff, "seconds");
            if (diff < COOLDOWN_SECONDS) {
                // console.log("Cooldown active, remaining:", COOLDOWN_SECONDS - diff, "seconds");
                setSendButtonDisabled(true)
                setCooldown(COOLDOWN_SECONDS - diff);
                setRefreshButton({
                    isDisabled: true,
                    isShow: true
                })
            } else {
                // console.log("Cooldown period over");
                setRefreshButton({
                    isDisabled: false,
                    isShow: false
                })
            }
        }
    }, [shop]);

    useEffect(() => {
        // console.log("cooldown...............>>>", cooldown)
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (cooldown === 0 && refreshButton.isDisabled) {
            if (isSendButtonDisabled) {
                setRefreshButton({
                    isDisabled: false,
                    isShow: true
                })
                setNotification({
                    message: '',
                    type: ''
                })
            }
        }
    }, [cooldown])

    const handleRefresh = () => {
        if (refreshButton.isDisabled) return
        setSendButtonDisabled(false)
    }

    const handleSendTest = async () => {
        if (!isValidPhoneNumber(phone.trim())) {
            setNotification({
                message: 'Invalid phone number. Make sure it includes the + and country code.',
                type: 'error'
            })
            return
        }

        if (testCount >= MAX_TESTS) {
            setNotification({
                message: 'Test limit reached. You have already tried 5 times.',
                type: 'error'
            })
            return
        }
        setSendButtonDisabled(true)

        try {
            const response = await fetch('/api/saveWhatsappTest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collectionName: "whatsappTests", documentName: shop, data: {
                        testCount: testCount + 1,
                        lastTestTime: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    },
                    phone, shop
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // console.log("errorData", errorData)
                const errorMsg = errorData?.error || 'Something went wrong while sending the message. Please try again later.';
                setNotification({
                    message: errorMsg,
                    type: 'error',
                });
                setSendButtonDisabled(false);
                return;
            }

            const data = await response.json()
            console.log("data", data?.message)
            setTestCount((prev) => prev + 1);
            setRefreshButton({
                isDisabled: true,
                isShow: true
            })
            localStorage.setItem(`whatsappTest_${shop}`, JSON.stringify({ lastTestTime: new Date().getTime() }))
            setNotification({
                message: 'Test message sent! You’ll receive it on WhatsApp shortly.',
                type: 'success'
            })
            setCooldown(COOLDOWN_SECONDS);
        } catch (error) {
            console.log("error occured on handleSendTest", error)
            setNotification({
                message: 'Something went wrong while sending message, please try again later',
                type: 'error'
            })
            setSendButtonDisabled(false)
        }
    }

    const handlePhoneNumberChange = (e: any) => {
        if (notification.message) {
            setNotification({
                message: '',
                type: ''
            })
        }
        setPhone(e)
    }


    return (
        <div className='mt-2 flex flex-col text-center md:text-left'>
            <div className='flex flex-row mt-3 mb-2 gap-2 items-center'>
                <p className="text-[13px] font-semibold">
                    Test WhatsApp message
                </p>
                <Tooltip width='wide' content={
                    <div className="flex flex-col gap-1 items-center custom-tooltip-content text-xs">
                        <div>Send a test WhatsApp message to see how it looks.</div>
                        <div>Enter your phone number</div>
                        <div>(Include the country code starting with +).</div>
                    </div>
                }>
                    <Icon source={InfoIcon} />
                </Tooltip>
            </div>
            <div className='flex flex-row text-center gap-3 phone-input-wrapper'>
                <TextField
                    type="text"
                    label=""
                    value={phone}
                    size='medium'
                    placeholder='Enter your phone number'
                    onChange={handlePhoneNumberChange}
                    autoComplete='phoneNumber'
                />
                <Button disabled={isSendButtonDisabled} variant="primary" size='large' onClick={handleSendTest}>Send Test</Button>

                {refreshButton.isShow && <div
                    className={`my-auto font-bold ${refreshButton.isDisabled ? "" : "cursor-pointer"}`}
                    onClick={handleRefresh}
                >
                    <Icon
                        source={
                            ReplayIcon
                        }
                    />
                </div>}
            </div>

            {notification.message && (
                <div>
                    <p
                        className={`text-sm mt-3 ${notification.type === "error" ? "text-red-600" : "text-green-600"
                            }`}
                    >
                        {notification.message}
                    </p>
                </div>
            )}

        </div >
    )
}
