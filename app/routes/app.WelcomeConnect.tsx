import { Card, Button, Spinner, Text, Link, TextField, Icon, Tooltip } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import AlienSVG from '~/components/SVGs/AlienSVG';
import { useTranslation } from 'react-i18next';
import SaveBarComponent from '~/components/SaveBarComponent';
import ConnectionStepSection from '~/components/WelcomPage/ConnectionStepSection';
import WhatWeDoSection from '~/components/WelcomPage/WhatWeDoSection';
import DashboardOverview from '~/components/WelcomPage/DashboardOverview';
import { useLoaderData } from '@remix-run/react';
import WhatsappTest from '~/components/WelcomPage/WhatsappTest/WhatsappTest';
import { authenticate } from '~/shopify.server';
import BlackFridaySaleBanner from '~/components/global/BlackFridaySaleBanner';
import { manageOnboarding } from '~/lib/onboarding/common';
// import { trackLCP } from '~/utils/lcpTracker';

export const loader = async ({ request }: any) => {
    try {
        const { admin, session } = await authenticate.admin(request)
        return { shop: session.shop }
    } catch (error) {
        console.log("error occured on app.welcomeconnect page loader", error)
        return {}
    }
}

const WelcomeConnect = () => {
    const { t } = useTranslation()
    const { shop }: any = useLoaderData()
    const [instance, setInstance] = useState<any>([]);
    const [qrCode, setQRCode] = useState('');
    const [stateInstance, setStateInstance] = useState('');
    // const [storeId, setStoreId] = useState('');
    const [pubsubData, setPubsubData] = useState({});
    // const [currentQRData, setCurrentQRData] = useState({});
    const [getPageData, setPageData] = React.useState<any>({
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
    const [isShowConnectionStatus, setShowConnectionStatus] = useState(false)
    const topics = ['message'];
    const [customMessage, setCustomMessage] = useState<any>()
    const [compareMessage, setCompareMessage] = useState<any>()
    const [isSaveButtonLoading, setSaveButtonLoading] = useState<any>(null)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [isDisBtnLoading, setDisBtnLoading] = useState(false)
    const [isLoading, setLoading] = useState(true)

    useEffect(() => {
        const isClean = compareMessage?.header === customMessage?.header && compareMessage?.content === customMessage?.content
        if (isClean) {
            shopify.saveBar.hide('welcome-connect-save-bar');
        } else {
            shopify.saveBar.show('welcome-connect-save-bar');
        }
    }, [customMessage, compareMessage]);

    useEffect(() => {
        fetchSettings()
        fetchDataAndFetchQR();
        handleFetchAbandonedCheckouts();
        getMessageData();
    }, []);

    // useEffect(() => {
    //     trackLCP('Welcomeconnect page');
    //   }, []);

    useEffect(() => {
        if (customMessage?.header) {
            setMessageLoading(false)
        }
    }, [customMessage])

    useEffect(() => {
        let intervalId: any;
        console.log("stateInstance on interval ", stateInstance, instance)
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
    }, [stateInstance, instance]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/firestore?collectionName=settings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const responsedata = await response.json();
            // console.log("responsedata", responsedata);

            if (Object.keys(responsedata.data).length) {
                const greenApiInstanceStatus = responsedata?.data?.greenApiInstanceStatus || "";
                setStateInstance(greenApiInstanceStatus)
            }
        } catch (error) {
            console.log("error on fetchSettings", error);
        } finally {
            setLoading(false)
        }
    };

    const updateGreenApiInstanceStatus = async (status: string) => {
        setStateInstance(status);
        try {
            const response = await fetch("/api/manageInstanceStatus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newGreenApiInstanceStatus: status }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                    "Failed to update greenApiInstanceStatus",
                    response.status,
                    errorData
                );
            } else {
                console.log("greenApiInstanceStatus updated successfully");
            }
        } catch (error) {
            console.error("Error occurred on updateGreenApiInstanceStatus:", error);
        }
    };


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
                    updateGreenApiInstanceStatus('notAuthorized');
                    manageOnboarding({ data: { step1: { connectWhatsapp: false } }, shop });
                } else if (data.qrData?.type === 'alreadyLogged') {
                    updateGreenApiInstanceStatus('authorized');
                    manageOnboarding({ data: { step1: { connectWhatsapp: true } }, shop });
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
                // savePubSubAndDBData({ url, id, token, argTopics: ["disconnecting"] })
                updateGreenApiInstanceStatus("notAuthorized")
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
                // updateGreenApiInstanceStatus('authorized');
                // await getMessageData()
            } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
                // updateGreenApiInstanceStatus('notAuthorized');
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

    const handleSaveMessage = async () => {
        try {
            setSaveButtonLoading("doLoad")
            console.log("message from handleSaveMessage", customMessage);
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
                manageOnboarding({ data: { step1: { editMessage: true } }, shop });
            }
        } catch (error) {
            console.log("error occured on handleSaveMessage", error);

        } finally {
            setSaveButtonLoading(null)
        }
    }

    const handleShowConnectionClick = () => {
        if (isInstanceDataLoading) {
            shopify.toast.show(t("global.toastMessage.loadingConnection"));
        } else {
            setShowConnectionStatus(true)
        }
    }

    const handleDiscardChanges = () => {
        setCustomMessage(compareMessage)
    }

    return (
        <>
            {isLoading ? <div className="flex justify-center items-center h-full w-full">
                <Spinner accessibilityLabel="Spinner example" size="large" />
            </div> : <div className="bg-[#f1f1f1]">
                <div className='start_page start_page_wrapper sm:!max-w-[100%]  px-4 md:px-0'>

                    <div className="lets_start_main_container dashboard_page_wrap">
                        <div className="w-full flex justify-center mb-6">
                            <BlackFridaySaleBanner btnClass="saleBannerButton" src={"/images/letsStartPage/topBanner.png"} className="cursor-pointer" />
                        </div>
                        <div>
                            <div className='text-center md:text-left'>
                                <Text variant="headingLg" as="h5">
                                    {stateInstance === "authorized" ? t("dashboard.title") : t("dashboard.authTitle")}
                                </Text>
                            </div>
                        </div>

                        <div className='mb-4'>
                            <p className='text-[13px] md:text-left mt-[6px] mb-4'>{
                                stateInstance === "authorized" ?
                                    t("dashboard.authSubTitle")
                                    :
                                    t("dashboard.subTitle")
                            }
                            </p>
                            {stateInstance === "authorized" ?
                                <DashboardOverview getPageData={getPageData} forPageType="WelcomeConnect" /> :
                                <ConnectionStepSection />
                            }
                        </div>
                        <Card >
                            <div className='flex flex-col lg:flex-row gap-8 lg:gap-10 '>
                                <div className="w-full lg:w-3/12">
                                    <div className="p-4 md:p-6 " >
                                        <div className='text-center md:text-left'>
                                            <p className="text-[13px] font-semibold">
                                                {t("dashboard.getQr")}
                                            </p>
                                        </div>
                                        {isShowConnectionStatus ? <>
                                            {stateInstance === "authorized" ? (
                                                <>
                                                    <div className='flex justify-center mt-6'>
                                                        <AlienSVG />
                                                    </div>
                                                    <div className='p-4 md:p-5 text-center md:text-left'>
                                                        <p className="text-center text-[13px]">
                                                            {t("dashboard.getQrDescription")}
                                                        </p>
                                                    </div>
                                                    <div className='mt-6 flex justify-center'>
                                                        <Button
                                                            onClick={() => disconnectInstance(instance?.apiUrl, instance?.idInstance, instance?.apiTokenInstance, false)}
                                                            disabled={isDisBtnLoading}
                                                            loading={isDisBtnLoading}
                                                            variant='primary'
                                                            size='large'
                                                        >
                                                            {t("dashboard.disconnectButtonText")}
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex justify-center">
                                                        <div className="w-[200px]">
                                                            {qrCode ? (
                                                                <img
                                                                    className="max-w-full h-auto mt-6 mx-auto"
                                                                    src={qrCode}
                                                                    alt="QR Code"
                                                                />
                                                            ) : (
                                                                <div className="max-w-full flex justify-center align-middle mt-32 mb-16 mx-auto">
                                                                    <Spinner
                                                                        accessibilityLabel="Small spinner example"
                                                                        size="small"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="font-semibold mt-8">
                                                        <p className="text-center text-[13px]">
                                                            {t("dashboard.qrDescription")}
                                                        </p>
                                                    </div>
                                                </>

                                            )}
                                        </> :
                                            <>
                                                <div className='flex justify-center mt-6'>
                                                    <AlienSVG />
                                                </div>
                                                <div className='p-4 md:p-5 text-center md:text-left'>
                                                    <p className="text-center text-[13px]">
                                                        {t("dashboard.connectedDescription")}
                                                    </p>
                                                </div>
                                                <div className='mt-2 flex justify-center'>
                                                    <Button
                                                        variant="primary"
                                                        size="large"
                                                        onClick={handleShowConnectionClick}
                                                    >
                                                        {t("dashboard.connectionStatusViewButton")}
                                                    </Button>
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>

                                <div className="border-l hidden lg:block mx-4"></div>
                                <div className="border-t lg:border-t-0 w-full my-4 lg:my-0 lg:hidden"></div>

                                <div
                                    className="p-4 md:p-6 w-full lg:w-3/5"
                                >
                                    <div className=" text-center md:text-left mb-6">
                                        <p className="text-[13px] font-semibold">
                                            {t("dashboard.messageBoxTitle")}
                                        </p>
                                    </div>
                                    <Card >
                                        {isMessageLoading ? <div className='flex justify-center items-center h-40 md:h-56' >
                                            <Spinner accessibilityLabel="Small spinner example" size="large" />
                                        </div>
                                            :
                                            <div className="flex-col" >
                                                <textarea
                                                    className="w-full h-10 border-none outline-none text-base resize-none"
                                                    value={customMessage.header}
                                                    onChange={(e) => {
                                                        setCustomMessage((prev: any) => ({
                                                            ...prev,
                                                            header: e.target.value
                                                        }))
                                                    }}
                                                    placeholder={t("settings.messageBoxHeadingPlaceholder")}
                                                />
                                                <textarea
                                                    className="w-full h-32 md:h-44 text-base border-none outline-none resize-none"
                                                    value={customMessage.content}
                                                    onChange={(e) => {
                                                        setCustomMessage((prev: any) => ({
                                                            ...prev,
                                                            content: e.target.value
                                                        }))
                                                    }}
                                                    placeholder={t("settings.messageBoxContentPlaceholder")}
                                                />
                                            </div>}
                                    </Card>
                                    <div className='mt-[6px] text-center md:text-left p-4 md:p-0'>
                                        <p className="text-[13px]">
                                            {t("dashboard.useArticle")} - <Link url="#" removeUnderline>link here</Link>
                                        </p>
                                    </div>
                                    <WhatsappTest shop={shop} t={t} />
                                </div>
                            </div>
                        </Card>
                        <div>
                            <WhatWeDoSection t={t} />
                        </div>
                    </div>
                </div >
            </div >}
            <SaveBarComponent
                onSave={handleSaveMessage}
                isLoading={isSaveButtonLoading}
                onDiscard={handleDiscardChanges}
                saveText={t("settings.messageBoxSaveButton")}
                discardText="Discard"
                variant="primary"
                id="welcome-connect-save-bar"
            />
        </>
    );

    async function handleFetchAbandonedCheckouts() {
        try {
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
                setPageData((prev: any) => ({
                    ...prev,
                    acrRate: acr?.toFixed(1),
                    recoveredCarts: Math.trunc(sales_count),
                    recoveredCartsSum: Math.trunc(sum_of_sales),
                    shopCurrency: currency,
                    abandonedCarts: checkout_count,
                    success: true
                }));
            } else {
                setPageData((prev: any) => ({
                    ...prev,
                    acrRate: 0,
                    recoveredCarts: 0,
                    recoveredCartsSum: 0,
                    shopCurrency: "",
                    abandonedCarts: 0,
                    success: true
                }));
            }
        } catch (error) {
            console.error("handleFetchAbandonedCheckouts Error on welcomeConnect", error);
        }
    }
};

export default WelcomeConnect;
