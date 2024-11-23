import { Badge, Button, Card, Divider, Page, SkeletonDisplayText, Spinner, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import AlienLogo from './images/Alien.png'

const ConnectPage = () => {
    const [planName, setPlanName] = useState('not set');
    const [getData, setData] = useState([]);
    const [instances, setInstances] = useState([]);
    const [qrCode, setQRCode] = useState('');
    const [showNumbers, setShowNumbers] = useState(false);
    const [stateInstance, setStateInstance] = useState('notAuthorized');
    const [storeId, setStoreId] = useState('');
    const [pubsubData, setPubsubData] = useState({});
    const [currentQRData, setCurrentQRData] = useState({});
    const [buttonData, setButtonData] = useState({});

    const topics = ['message'];

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
    };

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
    };

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
            console.log('Error fetching instances:', error);
        }
    };

    const getAuthStatus = async () => {
        const unauthorizedInstance = instances.find(instance => instance.status === 'notAuthorized');
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
            const fireStoreData = await getDataFromFirestore();

            if (Object.keys(fireStoreData).length === 0) {
                initializeFlow();
            } else {
                const stateInstanceData = await getInstanceState(fireStoreData?.greenAPIUrl, fireStoreData?.greenAPIId, fireStoreData?.greenAPIKey);

                if (stateInstanceData?.responseData?.stateInstance == 'authorized') {
                    setStateInstance('authorized');
                } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
                    await deleteConnectPageData();
                    initializeFlow();
                } else {
                    initializeFlow();
                }
            }
        }

        getFireData();
    }, [instances.length]);

    useEffect(() => {
        let intervalId;
        if (stateInstance !== 'authorized' && currentQRData.url && currentQRData.id && currentQRData.token) {
            intervalId = setInterval(() => {
                fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
            }, 3000);
        }
        return () => clearInterval(intervalId);
    }, [stateInstance, currentQRData]);

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div>
                            <div className='connection_main_container_heading'>
                                <Text variant="heading3xl" as="h3">
                                    Let's Connect
                                </Text>
                            </div>
                        </div>
                        <div className="start_price_container">
                            <div className="start_price_container_cards">
                                {stateInstance === 'authorized' ? (
                                    <Card>
                                        <div className="start_price_choose_plan">
                                            <div className='connection_alien_logo_section'>
                                                <div className='connectPage_connect_message'>
                                                    <Text variant="headingLg" as="h5">
                                                        your device is already﻿ connected!
                                                    </Text>
                                                </div>
                                            </div>
                                            <div className='connection_card_dialogue_section'>
                                                <div className="connection_card_after_qr_dialogue">
                                                    You should easiely send and receive WhatsApp messages!
                                                </div>
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
                    </div>
                </Page>
            </div>
        </div>
    );
};

export default ConnectPage;
