import { Badge, Button, Card, Page, Text, SkeletonDisplayText } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../StartPage.css';
import { useSubmit } from '@remix-run/react';
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import { ActionFunctionArgs } from 'react-router';
import { BillingInterval } from '@shopify/shopify-app-remix/server';
import cartLogo from './images/cart.png';
import bagLogo from './images/bag.png';
import dollarLogo from './images/dollar.png';
import tickmarkLogo from './images/TickMark.png';

export const action = async ({ request }) => {
    const formData = await request.formData();
    const planName = formData.get("planName") || MONTHLY_PLAN;

    const { billing } = await authenticate.admin(request);

    const okay = await billing.require({
        plans: [planName],
        isTest: false,
        onFailure: async () => billing.request({
            plan: planName,
            isTest: false
        }),
    });

    return null;
};

const LetsStart = () => {
    const [planName, setPlanName] = useState('not set');
    const [getData, setData] = useState([]);
    const [getAcrRate, setAcrRate] = React.useState(null);
    const submit = useSubmit();
    let sum = 0;
    let recoveredSum = 0;
    let count = 0;
    let currencySymbol = '';
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

    const handlePlanSelect = (planName) => {
        setPlanName(planName);
        const formData = new FormData();
        formData.append("planName", planName);
        submit(formData, { method: "post" });
    };

    const AllOverValue = () => {
        getData?.forEach(function (item) {
            if (item.completed_at == null) {
                var num = parseFloat(item.total_price)
                sum += num;
                count++;
            }
        })
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
    }

    useEffect(() => {
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
                        <div className='start_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                Let’s Start!
                            </Text>
                        </div>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingLg" as="h5">
                                Here’s a Dashboard of Your Lost Revenue
                            </Text>
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
                                        <div className='start_plan_content_value'>{
                                            count && getAcrRate != null ?
                                                isNaN(getAcrRate) ? "0.00%" : `${getAcrRate}%`
                                                :
                                                (<div style={{ height: "20px", paddingLeft: "20px" }}><SkeletonDisplayText size="small" /></div>)
                                        }</div>
                                        <div className='start_plan_content_heading'>ACR Rate</div>
                                        <div className='start_plan_content_sub_heading'>The amount of income waiting for recovery</div>
                                    </div>

                                </div>
                            </Card>
                        </div>
                        <div className="start_price_container">
                            <div className="start_price_container_heading">
                                <Text variant="headingLg" as="h5">
                                    Choose a plan and start Growing!
                                </Text>
                            </div>
                            <div className="start_price_container_cards">
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Starter</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">19$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge size="small" tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 10 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $1,000 in additional revenue per month!</li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Pro</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">49$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 49 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $10,000 in additional revenue per month!</li>
                                            </ul>

                                        </div>
                                    </div>
                                    <div className='popular_badge'>
                                        Most Popular
                                    </div>
                                </Card>
                                <Card>
                                    <div className="start_price_choose_plan">
                                        <div className='start_plan_name'>Advanced</div>
                                        <div className="start_plan_ammount_section">
                                            <div className="start_plan_ammount">99$</div>
                                            <div className="start_plan_ammount_suffix">/  Month</div>
                                        </div>
                                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>select</Button></div>
                                        <div className="star_plan_limit_dialogue">
                                            <ul className='start_plan_list'>
                                                <li className='start_plan_list_item'>Up to 100 abandoned carts per month</li>
                                                <li className='start_plan_list_item'>Potential to generate up to $100,000 in additional revenue per month!</li>
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
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
                setAcrRate(responseData?.acrRate);
                setData(responseData?.data || []);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
};

export default LetsStart;
