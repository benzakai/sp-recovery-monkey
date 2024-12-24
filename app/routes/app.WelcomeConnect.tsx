import { Card, Page, Button, Spinner, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import AlienLogo from './images/Alien.png'
import AbandonedCartsSummary from '~/components/AbandonedCartsSummary';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import { Link } from '@shopify/polaris';

const WelcomeConnect = () => {
    const [instances, setInstances] = useState([]);
    const [qrCode, setQRCode] = useState('');
    const [stateInstance, setStateInstance] = useState('notAuthorized');
    const [storeId, setStoreId] = useState('');
    const [pubsubData, setPubsubData] = useState({});
    const [currentQRData, setCurrentQRData] = useState({});
    const [getPageData, setPageData] = React.useState({
        abandonedCarts: [],
        abandonedCartsSum: 0,
        acrRate: null,
        allCarts: [],
        recoveredCarts: [],
        recoveredCartsSum: 0,
        shopCurrency: null,
        success: null
    });
    const [loadingPage, setLoadingPage] = useState(true)
    const topics = ['message'];
    const [customMessage, setCustomMessage] = useState()
    const [compareMessage, setCompareMessage] = useState()
    const [isSaveButtonLoading, setSaveButtonLoading] = useState(false)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [isDisBtnLoading, setDisBtnLoading] = useState(false)

    const fetchPhoneNumber = async (phonedata) => {
        const response = await fetch('/api/fetchPhoneNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(phonedata),
        });
        const data = await response.json();
        return data;
    }

    const sendDataToPubSub = async (message) => {
        const topicNames = topics;
        const response = await fetch('/api/sendPubSubData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, topicNames }),
        });
        const data = await response.json();
        setStateInstance('authorized');
    }

    const setDataInFirestore = async (collectionName, documentName, data) => {
        const response = await fetch('/api/firestore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ collectionName, documentName, data }),
        });
        const Responsedata = await response.json();
    }

    const fetchInstances = async () => {
        try {
            const response = await fetch('/api/getInstances');
            const data = await response.json();
            setInstances(data.instances);
        } catch (error) {
            console.error('Error fetching instances:', error);
        }
    };

    const getAuthStatus = async () => {
        const unauthorizedInstance = instances.find(instance => instance.status === 'notAuthorized');
        // console.log("instances.filter(instance => instance.status === 'notAuthorized');", instances.filter(instance => instance.status === 'notAuthorized'));
        if (unauthorizedInstance) {
            setCurrentQRData({
                url: unauthorizedInstance.apiUrl,
                id: unauthorizedInstance.idInstance,
                token: unauthorizedInstance.apiTokenInstance,
            });
        }
    };

    const fetchQR = async (url, id, token) => {

        try {
            const response = await fetch('/api/fetchQR', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, id, token }),
            });
            const data = await response.json();
            if (data.qrData?.type === 'qrCode') {
                setQRCode(`data:image/png;base64,${data.qrData.message}`);
            } else if (data.qrData?.type === 'alreadyLogged') {
                await handleFetchAbandonedCheckouts(true)
                setStateInstance('authorized');
                const phoneNumberData = await fetchPhoneNumber(currentQRData);
                setPubsubData(async (prevState) => {
                    const updatedData = {
                        ...prevState,
                        greenAPIId: currentQRData.id,
                        storeId: phoneNumberData?.storeId,
                        phoneNumber: phoneNumberData?.reponseData?.phone,
                        greenAPIKey: currentQRData?.token,
                        greenAPIUrl: currentQRData?.url,
                    };

                    await sendDataToPubSub(updatedData);
                    await setDataInFirestore('ConnectPagedata', `${updatedData?.storeId}`, updatedData)

                    return updatedData;
                });
            }
            if (data.storeId) setStoreId(data.storeId);
        } catch (error) {
            console.error('error', error);
        }
    };

    const getDataFromFirestore = async () => {
        const response = await fetch('/api/firestore?collectionName=ConnectPagedata', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const Responsedata = await response.json();
        if (Responsedata.data) {
            return Responsedata.data;
        } else {
            return null;
        }
    };

    const getInstanceState = async (url, id, token) => {
        try {
            const response = await fetch('/api/getInstanceStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, id, token }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching instance status:', error);
            return {};
        }
    }

    const deleteConnectPageData = async () => {
        try {
            const response = await fetch('/api/deleteConnectpageFire');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching instance status:', error);
            return {};
        }
    }

    const disconnectInstance = async () => {
        try {
            setDisBtnLoading(true)
            let fireStoreData;
            if (Object.keys(currentQRData).length === 0) {
                fireStoreData = await getDataFromFirestore();
            }
            // console.log("fireStoreData", fireStoreData);
            // console.log("currentQRData", currentQRData);

            const response = await fetch('/api/disconnectInstance', {
                method: "POST",
                body: JSON.stringify(Object.keys(currentQRData).length === 0 ? {
                    url: fireStoreData.greenAPIUrl,
                    id: fireStoreData.greenAPIId,
                    token: fireStoreData.greenAPIKey
                } : currentQRData)
            })
            if (response.ok) {
                const data = await response.json()
                console.log("data", data);
                await handleFetchAbandonedCheckouts(false)
                setStateInstance("notAuthorized")
            }
        } catch (error) {
            console.log("error occured on disconnectInstance", error);
        } finally {
            setDisBtnLoading(false)
        }
    }

    useEffect(() => {
        const initializeFlow = async () => {
            await fetchInstances();
            if (instances.length > 0) {
                await getAuthStatus();
                if (currentQRData.url && currentQRData.id && currentQRData.token) {
                    await fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
                }
            }
        };

        const getFireData = async () => {
            try {
                const fireStoreData = await getDataFromFirestore();
                let stateInstanceData;
                if (Object.keys(fireStoreData).length === 0) {
                    initializeFlow();
                } else {
                    stateInstanceData = await getInstanceState(fireStoreData?.greenAPIUrl, fireStoreData?.greenAPIId, fireStoreData?.greenAPIKey);
                    if (stateInstanceData?.responseData?.stateInstance == 'authorized') {
                        setStateInstance('authorized');
                    } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
                        await deleteConnectPageData();
                        initializeFlow();
                    } else {
                        initializeFlow();
                    }
                }
                const isInstanceAuthorized = stateInstanceData?.responseData?.stateInstance === 'authorized'
                // const isInstanceAuthorized1 = true
                // setStateInstance('authorized');
                // console.log("isInstanceAuthorized triggger", isInstanceAuthorized);
                await handleFetchAbandonedCheckouts(isInstanceAuthorized);

                const response = await fetch('/api/getMainCustomMessage')
                if (response.ok) {
                    const { messageData } = await response.json()
                    console.log("messageData", messageData);
                    setCustomMessage(messageData)
                    setCompareMessage(messageData)
                }
            } catch (error) {
                console.log("got error on getFireData", error);
            } finally {
                // console.log("is loading false triggger");
                setLoadingPage(false)
            }
        }

        getFireData();
    }, [instances.length]);

    useEffect(() => {
        if (customMessage?.header) {
            setMessageLoading(false)
        }
    }, [customMessage])

    useEffect(() => {
        let intervalId;
        if (stateInstance !== 'authorized' && currentQRData.url && currentQRData.id && currentQRData.token) {
            intervalId = setInterval(() => {
                fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
            }, 3000);
        }
        return () => clearInterval(intervalId);
    }, [stateInstance, currentQRData]);

    const handleSaveMessage = async () => {
        try {
            setSaveButtonLoading(true)
            // console.log("message from handleSaveMessage", customMessage);
            const response = await fetch('/api/saveMainCustomMessage', {
                method: 'POST',
                body: JSON.stringify(customMessage)
            })
            if (response.ok) {
                const topicNames = topics;
                const response = await fetch('/api/sendPubSubData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: customMessage, topicNames }),
                });
                const data = await response.json();
                setCompareMessage(customMessage)
            }
        } catch (error) {
            console.log("error occured on handleSaveMessage", error);

        } finally {
            setSaveButtonLoading(false)
        }
    }



    return (
        <>
            {loadingPage ?
                <div className='flex justify-center items-center w-full h-full'>
                    <Spinner accessibilityLabel="Spinner example" size="large" /></div>
                : <div className="flex justify-center bg-[#f1f1f1]">
                    <div className='start_page'>

                        <Page fullWidth>
                            <div className={stateInstance === 'authorized' ? "start_main_container" : "lets_start_main_container"}>
                                <div>
                                    {/* {stateInstance == 'authorized' ? (
                                <>
                                    <div className=''>
                                        <Text variant="heading3xl" as="h3">
                                            Welcome
                                        </Text>
                                    </div>
                                    <div className='connection_main_container_sub_heading'>
                                        <Text variant="headingLg" as="h5">
                                            Here’s a Dashboard of Your Lost Revenue
                                        </Text>
                                    </div>
                                </>
                            ) : (
                            )} */}
                                    <div className='pb-8'>
                                        <Text variant="heading3xl" as="h3">
                                            Welcome
                                        </Text>
                                    </div>
                                </div>

                                <div>
                                    <p className='font-bold text-2xl pb-6'>Here’s a Dashboard of Your {stateInstance === 'authorized' ? "Recovered" : "Lost"} Revenue</p>
                                    {stateInstance === 'authorized' ? <AbandonedCartsSummary getPageData={getPageData} /> : <StartPageCartSummary getPageData={getPageData} />}
                                </div>
                                <div className='flex'>
                                    <div className="start_price_container">
                                        <div className="start_price_container_heading">
                                            {stateInstance === 'authorized' ? (
                                                <Text variant="headingLg" as="h5">
                                                    your device is connected!
                                                </Text>
                                            ) : (
                                                <>
                                                    <Text variant="headingLg" as="h5">
                                                        Let’s Connect
                                                    </Text>
                                                    <div className='connection_card_sub_heading'>Open your WhatsApp app-&gt; Click ‘Setting’-&gt; Click ‘linked devices’</div>
                                                </>
                                            )}

                                        </div>
                                        <div className="start_price_container_cards">
                                            {stateInstance === 'authorized' ? (
                                                <Card>
                                                    <div className="start_price_choose_plan mb-4">
                                                        <div className='connection_alien_logo_section'>
                                                            <img className='connection_alien_logo' src={AlienLogo} alt="" />
                                                        </div>
                                                        <div className='connection_card_dialogue_section'>
                                                            <div className="connection_card_after_qr_dialogue">
                                                                You should easiely send and receive WhatsApp messages!
                                                            </div>
                                                        </div>
                                                        <div className='mt-4 flex justify-end'>
                                                            <Button onClick={disconnectInstance} disabled={isDisBtnLoading} loading={isDisBtnLoading} variant='primary'>
                                                                Disconnect
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : (
                                                <Card>
                                                    <div className="start_price_choose_plan">
                                                        <div className='connection_alien_logo_section'>
                                                            <div className="connection_qr_code">
                                                                {qrCode ? (
                                                                    <img className='qr_image_connection' src={qrCode} alt="QR Code" />
                                                                ) : (
                                                                    <Spinner accessibilityLabel="Small spinner example" size="small" />
                                                                )}

                                                            </div>

                                                        </div>
                                                        <div className='connection_card_dialogue_section'>
                                                            <div className="connection_card_before_qr_dialogue">
                                                                Scan the Qr-code to present the dialogs on your own ﻿device.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}
                                        </div>
                                    </div>

                                    {stateInstance === 'authorized' ? <div
                                        className=" ml-24 messge_box_welcome"
                                    // onClick={() => handleSelectCard(card.id)}
                                    >
                                        <div className="message_text_Welcome">
                                            <Text variant="headingLg" as="h5">
                                                Write/edit the message that sent's to your customers
                                            </Text>
                                        </div>
                                        <Card>
                                            {isMessageLoading ? <div className='flex justify-center items-center h-72'>
                                                <Spinner accessibilityLabel="Small spinner example" size="large" />
                                            </div> : <div className="flex-col" >
                                                <textarea
                                                    className="w-full h-10 border-none outline-none text-base"
                                                    value={customMessage.header}
                                                    onChange={(e) => {
                                                        setCustomMessage((prev) => ({
                                                            ...prev,
                                                            header: e.target.value
                                                        }))
                                                    }
                                                    }
                                                    placeholder="Card Header"
                                                />
                                                <textarea
                                                    className="w-full h-56 text-base border-none outline-none"
                                                    value={customMessage.content}
                                                    onChange={(e) => {
                                                        setCustomMessage((prev) => ({
                                                            ...prev,
                                                            content: e.target.value
                                                        }))
                                                    }}
                                                    placeholder="Card Body"
                                                />
                                                <div className='flex justify-end pr-3 pt-4'>
                                                    <Button
                                                        onClick={handleSaveMessage}
                                                        variant="primary"
                                                        disabled={compareMessage.header === customMessage.header && compareMessage.content === customMessage.content}
                                                        loading={isSaveButtonLoading}
                                                    >Save Text</Button>
                                                </div>
                                            </div>}
                                        </Card>
                                        {/* <div className='mt-5'>
                                        <Text variant="headingMd" as="h5">
                                        You can use the following article for crafting winning and conversion phrasing at the <Link url="https://help.shopify.com/manual" removeUnderline>link here.</Link>
                                        </Text>
                                    </div> */}
                                    </div> : null}
                                </div>
                            </div>
                        </Page>
                    </div>
                </div>}
        </>
    );

    async function handleFetchAbandonedCheckouts(isInstanceAuthorized: boolean) {
        try {
            const appSubscription = await fetchAppSubscription();
            // console.log("appSubscription", appSubscription);

            const response = await fetch("/api/abandoned-checkouts/get", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    appSubscriptionCreated: appSubscription?.activeSubscriptions?.[0]?.createdAt,
                    pageName: isInstanceAuthorized ? "WelcomeConnect" : "letsStart"
                })
            });

            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();

                if (responseData.success == true) {
                    setPageData({ ...responseData });
                }
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error on welcomeConnect", error);
        }
    }

    async function fetchAppSubscription() {
        try {
            const response = await fetch("/api/active/subscription/get");
            if (response.ok == true && response.status == 200) {
                const responseJson = await response.json();
                return responseJson;
            }
        } catch (error) {
            console.log("fetchAppSubscription ERROR on welcomeConnect", error);
        }
    }
};

export default WelcomeConnect;
