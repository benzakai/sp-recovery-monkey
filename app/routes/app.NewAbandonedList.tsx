import * as React from 'react';
import '../AbandonedCarts.css'
import { Card, Page, LegacyCard, DataTable, Pagination, Icon, Text, SkeletonDisplayText } from '@shopify/polaris';
import { CheckSmallIcon } from '@shopify/polaris-icons';
import { mainModule } from 'process';

import cartLogo from './images/cart.png';
import bagLogo from './images/bag.png';
import dollarLogo from './images/dollar.png';
import tickmarkLogo from './images/TickMark.png';

export default function NewAbandonedList() {
    const [getData, setData] = React.useState([]);
    const [sortOrder, setSortOrder] = React.useState('ascending');
    const [sortBy, setSortBy] = React.useState('created_at');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;
    const [searchTerm, setSearchTerm] = React.useState('');
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

    let sum = 0;
    let recoveredSum = 0;
    let count = 0;
    const AllOverValue = () => {
        getData?.forEach(function (item) {
            if (item.completed_at == null) {
                var num = parseFloat(item.total_price)
                sum += num;
                count++;
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

    const recoveredCheckoutsTotalPrice = () => {
        getData?.forEach((item) => {
            if (item.completed_at) {
                recoveredSum += parseFloat(item.total_price);
            }
        })
    };

    const CrossiconContent = () => {
        return (
            <svg className='checkSVG' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
        );
    };
    const CheckiconContent = () => {
        return (
            <svg className='checkSVG' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
        );
    };




    const sortedData = [...getData].sort((a, b) => {
        const dateA = new Date(a[sortBy]);
        const dateB = new Date(b[sortBy]);
        return dateB - dateA;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);


    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    React.useEffect(() => {
        handleFetchAbandonedCheckouts();

    }, []);
    AllOverValue();
    recoveredCheckoutsTotalPrice();
    storeCurrency();
    const GetDataRow = currentItems?.map((item) => [
        item.created_at?.split("T")[0] || 'N/A',
        item.customer?.first_name || item.customer?.last_name
            ? `${item.customer?.first_name || ''} ${item.customer?.last_name || ''}`.trim()
            : item.email || 'N/A',
        <div className='item_total_price'>{currencySymbol} {item.total_price}</div>,
        item.completed_at ? (
            <div className='list_status_section'> <Icon source={CheckiconContent} tone="base" /></div>
        ) : (
            <div className='list_status_section'> <Icon source={CrossiconContent} tone="base" /></div>
        ),
    ]);


    console.log(getData);
    console.log('GetDataRow', GetDataRow);

    const date = new Date();
    const formattedDate = date.toISOString(); // Format as ISO 8601 (UTC time)
    const dateObject = new Date(formattedDate);
    const timestamp = dateObject.getTime();
    const newDate = new Date(timestamp);
    console.log('newDate', newDate);



    return (

        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div className='abandoned_list_main_container_heading'>
                            <div className='start_main_container_sub_heading'>
                                <Text variant="heading3xl" as="h3">
                                    Abandoned carts!
                                </Text>
                            </div>
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
                        <div >
                            <div className="start_price_container_heading">
                                <Text variant="headingLg" as="h5">
                                Overview of Customers with Abandoned Carts
                                </Text>
                            </div>
                            <DataTable
                                columnContentTypes={[
                                    'text',
                                    'text',
                                    'text',
                                    'text',
                                ]}
                                headings={[
                                    'Date',
                                    'Name',
                                    'Revenue',
                                    'status',
                                ]}
                                rows={GetDataRow}
                                totals={['', '', `${currencySymbol}${sum.toFixed(2)}`, getData?.length]}
                                pagination={{
                                    hasNext: currentPage < totalPages,
                                    hasPrevious: currentPage > 1,
                                    onNext: handleNext,
                                    onPrevious: handlePrevious,
                                    label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, getData?.length)} of ${getData?.length} Abandoned carts`,
                                }}
                            />

                        </div>
                    </div>

                </Page>
            </div>
        </div>

    )

    async function handleFetchAbandonedCheckouts() {
        try {
            const response = await fetch("/api/abandoned-checkouts/get");
            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();
                // console.log('recoveredCarts',responseData?.recoveredCarts);

                setData(responseData?.data || []);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
}