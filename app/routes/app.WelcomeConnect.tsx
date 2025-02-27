import { Card, Page, Button, Spinner, Text, BlockStack, Link, SkeletonBodyText } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import AlienLogo from './images/Alien.png'
import AbandonedCartsSummary from '~/components/AbandonedCartsSummary';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import OneSVG from '~/components/SVGs/OneSVG';
import TwoSVG from '~/components/SVGs/TwoSVG';
import ThreeSVG from '~/components/SVGs/ThreeSVG';
import AlienSVG from '~/components/SVGs/AlienSVG';

const WelcomeConnect = () => {
    const [instance, setInstance] = useState([]);
    const [qrCode, setQRCode] = useState('');
    const [stateInstance, setStateInstance] = useState('');
    // const [storeId, setStoreId] = useState('');
    const [pubsubData, setPubsubData] = useState({});
    // const [currentQRData, setCurrentQRData] = useState({});
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
    const [isInstanceDataLoading, setInstanceDataLoading] = useState(true)
    const topics = ['message'];
    const [customMessage, setCustomMessage] = useState()
    const [compareMessage, setCompareMessage] = useState()
    const [isSaveButtonLoading, setSaveButtonLoading] = useState(false)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [isDisBtnLoading, setDisBtnLoading] = useState(false)

    const fetchPhoneNumber = async ({ url, id, token }: any) => {
        const response = await fetch('/api/fetchPhoneNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url, id, token
            }),
        });
        const data = await response.json();
        return data;
    }

    const sendDataToPubSub = async (message: any) => {
        const topicNames = topics;
        const response = await fetch('/api/sendPubSubData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, topicNames }),
        });
        const data = await response.json();
    }

    const setDataInFirestore = async (collectionName: any, documentName: any, data: any) => {
        const response = await fetch('/api/firestore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ collectionName, documentName, data }),
        });
        const Responsedata = await response.json();
    }

    const fetchInstance = async () => {
        try {
            const response = await fetch('/api/getInstance');
            const data = await response.json();
            setInstance(data.instance);
            return data.instance
        } catch (error) {
            console.error('Error fetching instance:', error);
        }
    };

    // const getAuthStatus = async () => {
    //     const unauthorizedInstance = instances.find(instance => instance.status === 'notAuthorized');
    //     // console.log("instances.filter(instance => instance.status === 'notAuthorized');", instances.filter(instance => instance.status === 'notAuthorized'));
    //     if (unauthorizedInstance) {
    //         setCurrentQRData({
    //             url: unauthorizedInstance.apiUrl,
    //             id: unauthorizedInstance.idInstance,
    //             token: unauthorizedInstance.apiTokenInstance,
    //         });
    //     }
    // };

    const savePubSubAndDBData = async ({ url, id, token }: any) => {
        try {
            const phoneNumberData = await fetchPhoneNumber({ url, id, token });
            setPubsubData(async (prevState) => {
                const updatedData = {
                    ...prevState,
                    greenAPIId: id,
                    storeId: phoneNumberData?.storeId,
                    phoneNumber: phoneNumberData?.reponseData?.phone,
                    greenAPIKey: token,
                    greenAPIUrl: url,
                };
                await sendDataToPubSub(updatedData);
                await setDataInFirestore('ConnectPagedata', `${updatedData?.storeId}`, updatedData);
                return updatedData;
            });
        } catch (error) {
            console.log("error occured on savePubSubAndDBData ", error);
        }
    }

    const fetchQR = async ({ url, id, token }: any) => {
        try {
            // console.log("fetcQR    url, id, token", url, id, token);
            const response = await fetch('/api/fetchQR', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, id, token }),
            });
            if (response.ok) {
                const data = await response.json();
                // console.log("data of fetchQR", data);
                if (data?.error?.includes("is deleted")) {
                    window.location.reload()
                }

                if (data.qrData?.type === 'qrCode') {
                    setQRCode(`data:image/png;base64,${data.qrData.message}`);
                } else if (data.qrData?.type === 'alreadyLogged') {
                    setStateInstance('authorized');
                    savePubSubAndDBData({ url, id, token })
                }
            }
        } catch (error) {
            console.error('error', error);
        }
    };


    // const getDataFromFirestore = async () => {
    //     const response = await fetch('/api/firestore?collectionName=ConnectPagedata', {
    //         method: 'GET',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     });
    //     const Responsedata = await response.json();
    //     if (Responsedata.data) {
    //         return Responsedata.data;
    //     } else {
    //         return null;
    //     }
    // };

    const getInstanceState = async ({ url, id, token }: any) => {
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

    const disconnectInstance = async (url: any, id: any, token: any, isDeleteFromDB: any) => {
        try {
            setDisBtnLoading(true)
            // console.log("fireStoreData", fireStoreData);
            // console.log("currentQRData", currentQRData);
            // the issue with disconnect instanec api is instance gets deleted
            const response = await fetch('/api/disconnectInstance', {
                method: "POST",
                body: JSON.stringify({
                    url,
                    id,
                    token,
                    isDeleteFromDB
                })
            })
            if (response.ok) {
                const data = await response.json()
                // console.log("data", data);
                // await handleFetchAbandonedCheckouts(false)
                setStateInstance("notAuthorized")
            }
        } catch (error) {
            console.log("error occured on disconnectInstance", error);
        } finally {
            setDisBtnLoading(false)
        }
    }

    const getMessageData = async () => {
        try {
            const response = await fetch('/api/getMainCustomMessage')
            if (response.ok) {
                const { messageData } = await response.json()
                // console.log("messageData", messageData);
                setCustomMessage(messageData)
                setCompareMessage(messageData)
            }
        } catch (error) {
            console.log("error occured on getMessageData", error);
        }
    }
    const getFireData = async () => {
        try {
            const instanceData = await fetchInstance();
            // console.log("instanceData", instanceData);
            const stateInstanceData = await getInstanceState({ url: instanceData.apiUrl, id: instanceData.idInstance, token: instanceData.apiTokenInstance });
            // console.log("stateInstanceData?.responseData?.stateInstance", stateInstanceData?.responseData?.stateInstance);
            if (stateInstanceData?.responseData?.stateInstance == 'authorized') {
                setStateInstance('authorized');
                // await getMessageData()
            } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
                setStateInstance('notAuthorized');
                deleteConnectPageData();
            }
            // const isInstanceAuthorized = stateInstanceData?.responseData?.stateInstance === 'authorized'
            // const isInstanceAuthorized1 = true
            // setStateInstance('authorized');
            // console.log("isInstanceAuthorized triggger", isInstanceAuthorized);
            // await handleFetchAbandonedCheckouts(isInstanceAuthorized);
            return { url: instanceData.apiUrl, id: instanceData.idInstance, token: instanceData.apiTokenInstance }
        } catch (error) {
            console.log("got error on getFireData", error);
        }
    }

    useEffect(() => {
        const fetchDataAndFetchQR = async () => {
            try {
                const { url, id, token }: any = await getFireData();
                if (url && id && token) {
                    await fetchQR({ url, id, token });
                } else {
                    console.error('Missing URL, ID, or Token');
                }
            } catch (error) {
                console.log("error occured on fetchDataAndFetchQR", error);
            } finally {
                setInstanceDataLoading(false)
            }
        };
        getMessageData();
        fetchDataAndFetchQR();
        handleFetchAbandonedCheckouts();
    }, []);

    useEffect(() => {
        if (customMessage?.header) {
            setMessageLoading(false)
        }
    }, [customMessage])

    useEffect(() => {
        let intervalId: any;
        if (stateInstance !== 'authorized' && instance?.apiUrl && instance?.idInstance && instance?.apiTokenInstance) {
            intervalId = setInterval(async () => {
                await fetchQR({ url: instance?.apiUrl, id: instance?.idInstance, token: instance?.apiTokenInstance });
            }, 3000);
        }
        // console.log("stateInstance==========>", stateInstance);
        if (stateInstance) {
            // handleFetchAbandonedCheckouts(stateInstance === 'authorized' ? true : false);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [stateInstance]);

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
            <div className="flex justify-center bg-[#f1f1f1]">
                <div className='start_page'>

                    <Page fullWidth>
                        <div className="lets_start_main_container">
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
                                {isInstanceDataLoading ? <div className='w-64' style={{ paddingBottom: "28px" }}><SkeletonBodyText lines={2} /></div> :
                                    <p className='font-bold text-2xl pb-6'>Here’s a Dashboard of Your {stateInstance === 'authorized' ? "Recovered" : "Lost"} Revenue</p>
                                }
                                {/* {stateInstance === 'authorized' ? <AbandonedCartsSummary getPageData={getPageData} forPageType="WelcomeConnect" /> : <StartPageCartSummary getPageData={getPageData} />} */}
                                <AbandonedCartsSummary getPageData={getPageData} forPageType="WelcomeConnect" />
                            </div>
                            <div className='flex'>
                                <div className="start_price_container">
                                    <div className="start_price_container_heading">
                                        {isInstanceDataLoading ? <div className='w-64'><SkeletonBodyText lines={2} /></div> :
                                            <>
                                                {stateInstance === 'authorized' ? (
                                                    <Text variant="headingLg" as="h5">
                                                        your device is connected!
                                                    </Text>
                                                ) : (
                                                    <>
                                                        <Text variant="headingLg" as="h5">
                                                            Let’s Connect
                                                        </Text>
                                                        {/* <div className='connection_card_sub_heading'>Open your WhatsApp app-&gt; Click ‘Setting’-&gt; Click ‘linked devices’</div> */}
                                                    </>
                                                )}
                                            </>
                                        }
                                    </div>
                                    <div className="start_price_container_cards">
                                        {stateInstance === 'authorized' ? (
                                            <Card>
                                                <div className="w-60" style={{ height: '24.5rem' }}>
                                                    <div className='connection_alien_logo_section'>
                                                        <AlienSVG />
                                                    </div>
                                                    <div className='p-5'>
                                                        <Text variant="bodyLg" as="p">
                                                            You should easiely send and receive WhatsApp messages!
                                                        </Text>
                                                    </div>
                                                    <div className='mt-14 flex justify-end'>
                                                        <Button onClick={() => disconnectInstance(instance?.apiUrl, instance?.idInstance, instance?.apiTokenInstance, false)} disabled={isDisBtnLoading} loading={isDisBtnLoading} variant='primary'>
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <div className="w-60" style={{ height: '24.5rem' }}>
                                                    <div className='connection_alien_logo_section'>
                                                        <div className="connection_qr_code">
                                                            {qrCode ? (
                                                                <img className='qr_image_connection' src={qrCode} alt="QR Code" />
                                                            ) : (
                                                                <Spinner accessibilityLabel="Small spinner example" size="small" />
                                                            )}

                                                        </div>

                                                    </div>
                                                    {isInstanceDataLoading ?
                                                        <>
                                                            <div className='mx-auto w-60 mb-10'>
                                                                <SkeletonBodyText lines={3} />
                                                            </div>
                                                            <div className='mx-auto w-48'>
                                                                <SkeletonBodyText lines={4} />
                                                            </div>
                                                        </>
                                                        : <>
                                                            <div className='connection_card_dialogue_section font-semibold text-'>
                                                                <Text variant="headingMd" as="p">
                                                                    Scan the Qr-code to present the dialogs on your own ﻿device:
                                                                </Text>
                                                            </div>
                                                            <div className='mb-9'>
                                                                <BlockStack>
                                                                    <div className='flex flex-row gap-2 mb-2 mt-4'>
                                                                        <OneSVG />
                                                                        <Text variant="bodyMd" as="p">Open your WhatsApp app</Text>
                                                                    </div>
                                                                    <div className='flex flex-row gap-2 mb-2'>
                                                                        <TwoSVG />
                                                                        <Text variant="bodyMd" as="p">Click ‘Setting’</Text>
                                                                    </div>
                                                                    <div className='flex flex-row gap-2 mb-2'>
                                                                        <ThreeSVG />
                                                                        <Text variant="bodyMd" as="p">Click ‘linked devices’</Text>
                                                                    </div>
                                                                </BlockStack>
                                                            </div>
                                                        </>}

                                                </div>
                                            </Card>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className=" ml-24 messge_box_welcome"
                                // onClick={() => handleSelectCard(card.id)}
                                >
                                    <div className="message_text_Welcome">
                                        <Text variant="headingLg" as="h5">
                                            write/edit the message that sent's to your customers
                                        </Text>
                                    </div>
                                    <Card>
                                        {isMessageLoading ? <div className='flex justify-center items-center' style={{ height: "24.5rem" }}>
                                            <Spinner accessibilityLabel="Small spinner example" size="large" />
                                        </div> : <div className="flex-col" style={{ height: "24.5rem" }}>
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
                                                className="w-full h-72 text-base border-none outline-none"
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
                                                    disabled={compareMessage?.header === customMessage?.header && compareMessage.content === customMessage.content}
                                                    loading={isSaveButtonLoading}
                                                >Save Text</Button>
                                            </div>
                                        </div>}
                                    </Card>
                                    {/* <div className='mt-4'>
                                            <Text variant="bodyLg" as="p">
                                                You can use the following article for crafting winning and conversion phrasing at the <Link url="https://help.shopify.com/manual" removeUnderline>link here.</Link>
                                            </Text>
                                        </div> */}
                                </div>
                            </div>
                        </div>
                    </Page>
                </div >
            </div >
        </>
    );

    async function handleFetchAbandonedCheckouts() {
        try {
            // const appSubscription = await fetchAppSubscription();
            // console.log("started handleFetchAbandonedCheckouts on welcomeConnect")
            const responseCards = await fetch("/api/welcome-page/cards-data", {
                method: "GET",
            })
            if (!responseCards.ok) {
                console.error("failed to fetch cards data", responseCards.status);
                return;
            }
            const responseCardsData = await responseCards.json()
            if (responseCardsData?.success && responseCardsData?.dashboardData) {
                const { acr, sales_count, sum_of_sales, currency, checkout_count, shopCurrency } = responseCardsData?.dashboardData;
                setPageData((prev) => ({
                    ...prev,
                    acrRate: acr?.toFixed(1),
                    recoveredCarts: Math.trunc(sales_count),
                    recoveredCartsSum: Math.trunc(sum_of_sales),
                    shopCurrency: currency,
                    abandonedCarts: checkout_count,
                    success: true
                }));
            } else {
                setPageData((prev) => ({
                    ...prev,
                    acrRate: 0,
                    recoveredCarts: 0,
                    recoveredCartsSum: 0,
                    shopCurrency: "",
                    abandonedCarts: 0,
                    success: true
                }));
            }
            // console.log("ended handleFetchAbandonedCheckouts on welcomeConnect")
            //.....................................//...................................//

            // const responseAbandoned = await fetch("/api/abandoned-checkouts/get", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         appSubscriptionCreated: appSubscription?.activeSubscriptions?.[0]?.createdAt,
            //         pageName: isInstanceAuthorized ? "WelcomeConnect" : "letsStart"
            //     })
            // })
            // if (!responseAbandoned.ok) {
            //     console.error("failed to fetch abandoned checkouts", responseAbandoned.status);
            //     return;
            // }
            // const responseAbandonedData = await responseAbandoned.json()
            // if (responseAbandonedData?.success) {
            //     const {
            //         abandonedCarts,
            //         abandonedCartsSum,
            //         allCarts,
            //         shopCurrency
            //     } = responseAbandonedData;
            //     setPageData((prev) => ({
            //         ...prev,
            //         abandonedCarts,
            //         abandonedCartsSum,
            //         allCarts,
            //         shopCurrency: shopCurrency
            //     }));
            // }
        } catch (error) {
            console.error("handleFetchAbandonedCheckouts Error on welcomeConnect", error);
        }
    }

    // async function fetchAppSubscription() {
    //     try {
    //         const response = await fetch("/api/active/subscription/get");
    //         if (response.ok == true && response.status == 200) {
    //             const responseJson = await response.json();
    //             return responseJson;
    //         }
    //     } catch (error) {
    //         console.log("fetchAppSubscription ERROR on welcomeConnect", error);
    //     }
    // }
};

export default WelcomeConnect;
