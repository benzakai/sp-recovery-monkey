import { Badge, Button, Card, Divider, Page, SkeletonDisplayText, Spinner, Text } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';

import cartLogo from './images/cart.png';
import bagLogo from './images/bag.png';
import dollarLogo from './images/dollar.png';
import tickmarkLogo from './images/TickMark.png';
import AlienLogo from './images/Alien.png'






const WelcomeConnect = () => {
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
    let sum = 0;
    let recoveredSum = 0;
    let count = 0;
    let currencySymbol = '';
    const topics = ['message'];
    const currencySymbols = {
        AED: "د.إ", // United Arab Emirates Dirham
        AFN: "؋",   // Afghan Afghani
        ALL: "L",   // Albanian Lek
        AMD: "֏",   // Armenian Dram
        ANG: "ƒ",   // Netherlands Antillean Guilder
        AOA: "Kz",  // Angolan Kwanza
        ARS: "$",   // Argentine Peso
        AUD: "$",   // Australian Dollar
        AWG: "ƒ",   // Aruban Florin
        AZN: "₼",   // Azerbaijani Manat
        BAM: "KM",  // Bosnia-Herzegovina Convertible Mark
        BBD: "$",   // Barbadian Dollar
        BDT: "৳",   // Bangladeshi Taka
        BGN: "лв",  // Bulgarian Lev
        BHD: ".د.ب",// Bahraini Dinar
        BIF: "FBu", // Burundian Franc
        BMD: "$",   // Bermudian Dollar
        BND: "$",   // Brunei Dollar
        BOB: "Bs.", // Bolivian Boliviano
        BRL: "R$",  // Brazilian Real
        BSD: "$",   // Bahamian Dollar
        BTN: "Nu.", // Bhutanese Ngultrum
        BWP: "P",   // Botswana Pula
        BYN: "Br",  // Belarusian Ruble
        BZD: "$",   // Belize Dollar
        CAD: "$",   // Canadian Dollar
        CDF: "FC",  // Congolese Franc
        CHF: "CHF", // Swiss Franc
        CLP: "$",   // Chilean Peso
        CNY: "¥",   // Chinese Yuan
        COP: "$",   // Colombian Peso
        CRC: "₡",   // Costa Rican Colón
        CUP: "$",   // Cuban Peso
        CVE: "$",   // Cape Verdean Escudo
        CZK: "Kč",  // Czech Koruna
        DJF: "Fdj", // Djiboutian Franc
        DKK: "kr",  // Danish Krone
        DOP: "$",   // Dominican Peso
        DZD: "د.ج", // Algerian Dinar
        EGP: "£",   // Egyptian Pound
        ERN: "Nfk", // Eritrean Nakfa
        ETB: "Br",  // Ethiopian Birr
        EUR: "€",   // Euro
        FJD: "$",   // Fijian Dollar
        FKP: "£",   // Falkland Islands Pound
        FOK: "kr",  // Faroese Króna
        GBP: "£",   // British Pound Sterling
        GEL: "₾",   // Georgian Lari
        GGP: "£",   // Guernsey Pound
        GHS: "₵",   // Ghanaian Cedi
        GIP: "£",   // Gibraltar Pound
        GMD: "D",   // Gambian Dalasi
        GNF: "FG",  // Guinean Franc
        GTQ: "Q",   // Guatemalan Quetzal
        GYD: "$",   // Guyanese Dollar
        HKD: "$",   // Hong Kong Dollar
        HNL: "L",   // Honduran Lempira
        HRK: "kn",  // Croatian Kuna
        HTG: "G",   // Haitian Gourde
        HUF: "Ft",  // Hungarian Forint
        IDR: "Rp",  // Indonesian Rupiah
        ILS: "₪",   // Israeli New Shekel
        IMP: "£",   // Isle of Man Pound
        INR: "₹",   // Indian Rupee
        IQD: "ع.د", // Iraqi Dinar
        IRR: "﷼",   // Iranian Rial
        ISK: "kr",  // Icelandic Króna
        JEP: "£",   // Jersey Pound
        JMD: "$",   // Jamaican Dollar
        JOD: "د.ا", // Jordanian Dinar
        JPY: "¥",   // Japanese Yen
        KES: "KSh", // Kenyan Shilling
        KGS: "с",   // Kyrgyzstani Som
        KHR: "៛",   // Cambodian Riel
        KID: "$",   // Kiribati Dollar
        KMF: "CF",  // Comorian Franc
        KRW: "₩",   // South Korean Won
        KWD: "د.ك", // Kuwaiti Dinar
        KYD: "$",   // Cayman Islands Dollar
        KZT: "₸",   // Kazakhstani Tenge
        LAK: "₭",   // Lao Kip
        LBP: "ل.ل", // Lebanese Pound
        LKR: "Rs",  // Sri Lankan Rupee
        LRD: "$",   // Liberian Dollar
        LSL: "L",   // Lesotho Loti
        LYD: "ل.د", // Libyan Dinar
        MAD: "د.م.",// Moroccan Dirham
        MDL: "L",   // Moldovan Leu
        MGA: "Ar",  // Malagasy Ariary
        MKD: "ден", // Macedonian Denar
        MMK: "Ks",  // Myanmar Kyat
        MNT: "₮",   // Mongolian Tögrög
        MOP: "P",   // Macanese Pataca
        MRU: "UM",  // Mauritanian Ouguiya
        MUR: "₨",   // Mauritian Rupee
        MVR: "Rf",  // Maldivian Rufiyaa
        MWK: "MK",  // Malawian Kwacha
        MXN: "$",   // Mexican Peso
        MYR: "RM",  // Malaysian Ringgit
        MZN: "MT",  // Mozambican Metical
        NAD: "$",   // Namibian Dollar
        NGN: "₦",   // Nigerian Naira
        NIO: "C$",  // Nicaraguan Córdoba
        NOK: "kr",  // Norwegian Krone
        NPR: "₨",   // Nepalese Rupee
        NZD: "$",   // New Zealand Dollar
        OMR: "ر.ع.",// Omani Rial
        PAB: "B/.", // Panamanian Balboa
        PEN: "S/",  // Peruvian Sol
        PGK: "K",   // Papua New Guinean Kina
        PHP: "₱",   // Philippine Peso
        PKR: "₨",   // Pakistani Rupee
        PLN: "zł",  // Polish Złoty
        PYG: "₲",   // Paraguayan Guarani
        QAR: "ر.ق", // Qatari Riyal
        RON: "lei", // Romanian Leu
        RSD: "din", // Serbian Dinar
        RUB: "₽",   // Russian Ruble
        RWF: "FRw", // Rwandan Franc
        SAR: "﷼",   // Saudi Riyal
        SBD: "$",   // Solomon Islands Dollar
        SCR: "₨",   // Seychellois Rupee
        SDG: "ج.س.",// Sudanese Pound
        SEK: "kr",  // Swedish Krona
        SGD: "$",   // Singapore Dollar
        SHP: "£",   // Saint Helena Pound
        SLL: "Le",  // Sierra Leonean Leone
        SOS: "Sh",  // Somali Shilling
        SRD: "$",   // Surinamese Dollar
        SSP: "£",   // South Sudanese Pound
        STN: "Db",  // São Tomé and Príncipe Dobra
        SYP: "ل.س", // Syrian Pound
        SZL: "L",   // Swazi Lilangeni
        THB: "฿",   // Thai Baht
        TJS: "ЅМ",  // Tajikistani Somoni
        TMT: "m",   // Turkmenistani Manat
        TND: "د.ت", // Tunisian Dinar
        TOP: "T$",  // Tongan Paʻanga
        TRY: "₺",   // Turkish Lira
        TTD: "$",   // Trinidad and Tobago Dollar
        TWD: "NT$", // New Taiwan Dollar
        TZS: "Sh",  // Tanzanian Shilling
        UAH: "₴",   // Ukrainian Hryvnia
        UGX: "USh", // Ugandan Shilling
        USD: "$",   // United States Dollar
        UYU: "$U",  // Uruguayan Peso
        UZS: "лв",  // Uzbekistani Som
        VES: "Bs.", // Venezuelan Bolívar
        VND: "₫",   // Vietnamese Dong
        VUV: "VT",  // Vanuatu Vatu
        WST: "T",   // Samoan Tala
        XAF: "FCFA",// Central African CFA Franc
        XCD: "$",   // East Caribbean Dollar
        XOF: "CFA", // West African CFA Franc
        XPF: "₣",   // CFP Franc
        YER: "﷼",   // Yemeni Rial
        ZAR: "R",   // South African Rand
        ZMW: "ZK",  // Zambian Kwacha
        ZWL: "$",   // Zimbabwean Dollar
    };

    const fetchPhoneNumber = async (phonedata) => {
        const response = await fetch('/api/fetchPhoneNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(phonedata),
        });
        const data = await response.json();
        console.log('Phone number API response:', data);
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
        console.log('Sent pubsub data:', data);
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
        console.log('Sent firestore data:', Responsedata);
    }





    const fetchInstances = async () => {
        try {
            const response = await fetch('/api/getInstances');
            const data = await response.json();
            setInstances(data.instances);
            console.log('Fetched instances:', data.instances);
        } catch (error) {
            console.error('Error fetching instances:', error);
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
        console.log('fetchQr running');

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
                console.log('Already logged in');
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

                    console.log('PubSubData:', updatedData);
                    await sendDataToPubSub(updatedData);
                    await setDataInFirestore('ConnectPagedata', `${updatedData?.storeId}`, updatedData)

                    return updatedData;
                });

                console.log('currentQRData', currentQRData);
                // await sendDataToExpress(currentQRData);

            }
            if (data.storeId) setStoreId(data.storeId);
        } catch (error) {
            console.error('Error fetching QR code:', error);
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
            // Filter out the empty objects
            // const storeId = Responsedata.storeId; // Assuming Responsedata contains storeId
            // const filteredData = Responsedata.data.filter(item => 
            //     Object.keys(item).length > 0 && item.storeId == storeId
            // );
            console.log('filteredData connectPage', Responsedata);
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
            // console.log('fireStoreData',fireStoreData);
            if (Object.keys(fireStoreData).length === 0) {
                initializeFlow();
            } else {
                const stateInstanceData = await getInstanceState(fireStoreData?.greenAPIUrl, fireStoreData?.greenAPIId, fireStoreData?.greenAPIKey);
                // console.log('stateInstanceData',stateInstanceData);
                if (stateInstanceData?.responseData?.stateInstance == 'authorized') {
                    setStateInstance('authorized');
                } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
                    console.log('notAuthorized');
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
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(intervalId);
    }, [stateInstance, currentQRData]);



    const AllOverValue = () => {
        getData?.forEach(function (item) {
            if (item.completed_at == null) {
                var num = parseFloat(item.total_price)
                sum += num;
                count++;
            }
        })
        // console.log('count', count);

    };

    const recoveredCheckoutsTotalPrice = () => {
        getData?.forEach((item) => {
            if (item.completed_at) {
                recoveredSum += parseFloat(item.total_price);
            }
        })
    };
    const storeCurrency = () => {
        getData?.forEach(function (item) {
            let currencyCode = item?.currency?.currency || item?.currency;
            if (!currencySymbol) {
                currencySymbol = currencySymbols[currencyCode] || currencyCode
            }
        })
        console.log('currencySymbol', currencySymbol);

    }



    useEffect(() => {
        console.log('useefect running');

        handleFetchAbandonedCheckouts();


    }, []);

    AllOverValue();
    recoveredCheckoutsTotalPrice();
    storeCurrency();

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div >
                            {stateInstance == 'authorized' ? (
                                <>
                                    <div className='connection_main_container_heading'>
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
                                <div className='connection_main_container_heading'>
                                    <Text variant="heading3xl" as="h3">
                                        Welcome
                                    </Text>
                                </div>
                            )}

                        </div>
                        <div>
                            <Card>
                                <div className='start_pricing_plans'>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={cartLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>{getData?.length > 0 ?
                                            (
                                                <>
                                                    <div style={{ height: "20px" }}>{count}</div>
                                                </>
                                            ) :
                                            (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>
                                            )}</div>
                                        <div className='start_plan_content_heading'>Abandoned Carts</div>
                                        <div className='start_plan_content_sub_heading'>Customers waiting for you to complete their purchase</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={bagLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>{currencySymbol}{sum ? (sum.toFixed(2)) : (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>
                                        )}</div>
                                        <div className='start_plan_content_heading'>Missed Revenue</div>
                                        <div className='start_plan_content_sub_heading'>The amount you could have earned from these carts</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={dollarLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>{currencySymbol}{recoveredSum ? (recoveredSum.toFixed(2)) : (<div style={{ height: "20px", paddingLeft: "40px" }}><SkeletonDisplayText size="small" /></div>
                                        )}</div>
                                        <div className='start_plan_content_heading'>Recovered Revenue</div>
                                        <div className='start_plan_content_sub_heading'>When you make money with our help, it appears here</div>
                                    </div>
                                    <div
                                        className='start_pricing_plans_card'
                                    >
                                        <div className='start_plan_content_logo_container'><img className='start_plan_content_logo' src={tickmarkLogo} alt="" /></div>
                                        <div className='start_plan_content_value'>0.0%</div>
                                        <div className='start_plan_content_heading'>ACR Rate</div>
                                        <div className='start_plan_content_sub_heading'>The amount of income waiting for recovery</div>
                                    </div>

                                </div>
                            </Card>
                        </div>
                        <div className="start_price_container">
                            <div className="start_price_container_heading">
                                {stateInstance === 'authorized' ? (
                                    <Text variant="headingLg" as="h5">
                                        your device is already﻿ connected!
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
                                        <div className="start_price_choose_plan">
                                            <div className='connection_alien_logo_section'>
                                                <img className='connection_alien_logo' src={AlienLogo} alt="" />
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

    async function handleFetchAbandonedCheckouts() {


        try {
            const response = await fetch("/api/abandoned-checkouts/get");
            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();
                // console.log('api response',responseData?.data || []);
                setData(responseData?.data || []);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
};

export default WelcomeConnect;
