import * as React from 'react';
import '../AbandonedCarts.css'
import { Card, Page } from '@shopify/polaris';

export default function AbandonedCheckouts() {
    const [getData, setData] = React.useState([]);
    const [sortOrder, setSortOrder] = React.useState('ascending');
    const [sortBy, setSortBy] = React.useState('created_at');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
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
    }

    const recoveredCheckoutsTotalPrice = () => {
        getData?.forEach((item) => {
            if (item.completed_at) {
                recoveredSum += parseFloat(item.total_price);
            }
        })
    };

    const sortedData = [...getData].sort((a, b) => {
        const dateA = new Date(a[sortBy]);
        const dateB = new Date(b[sortBy]);
        return dateB - dateA;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    React.useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);
    AllOverValue();
    recoveredCheckoutsTotalPrice();
    storeCurrency();

    const date = new Date();
    const formattedDate = date.toISOString();
    const dateObject = new Date(formattedDate);
    const timestamp = dateObject.getTime();
    const newDate = new Date(timestamp);

    return (
        <Page>
            <Card>
                <div className="container">
                    <div className="card">
                        <div className="header">
                            <div>Abandoned </div><div> Carts</div>
                        </div>

                        <div className="row">
                            <div className="left-column">
                                <div className="data-block">
                                    <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" /></svg></div>
                                    <div className="data-text">{getData?.length > 0 ? count : '0'}</div>
                                </div>
                                <div className="subtext">Abandoned Carts</div>
                                <br />
                                <div className="data-block">
                                    <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M326.7 403.7c-22.1 8-45.9 12.3-70.7 12.3s-48.7-4.4-70.7-12.3l-.8-.3c-30-11-56.8-28.7-78.6-51.4C70 314.6 48 263.9 48 208C48 93.1 141.1 0 256 0S464 93.1 464 208c0 55.9-22 106.6-57.9 144c-1 1-2 2.1-3 3.1c-21.4 21.4-47.4 38.1-76.3 48.6zM256 91.9c-11.1 0-20.1 9-20.1 20.1l0 6c-5.6 1.2-10.9 2.9-15.9 5.1c-15 6.8-27.9 19.4-31.1 37.7c-1.8 10.2-.8 20 3.4 29c4.2 8.8 10.7 15 17.3 19.5c11.6 7.9 26.9 12.5 38.6 16l2.2 .7c13.9 4.2 23.4 7.4 29.3 11.7c2.5 1.8 3.4 3.2 3.7 4c.3 .8 .9 2.6 .2 6.7c-.6 3.5-2.5 6.4-8 8.8c-6.1 2.6-16 3.9-28.8 1.9c-6-1-16.7-4.6-26.2-7.9c0 0 0 0 0 0s0 0 0 0s0 0 0 0c-2.2-.7-4.3-1.5-6.4-2.1c-10.5-3.5-21.8 2.2-25.3 12.7s2.2 21.8 12.7 25.3c1.2 .4 2.7 .9 4.4 1.5c7.9 2.7 20.3 6.9 29.8 9.1l0 6.4c0 11.1 9 20.1 20.1 20.1s20.1-9 20.1-20.1l0-5.5c5.3-1 10.5-2.5 15.4-4.6c15.7-6.7 28.4-19.7 31.6-38.7c1.8-10.4 1-20.3-3-29.4c-3.9-9-10.2-15.6-16.9-20.5c-12.2-8.8-28.3-13.7-40.4-17.4l-.8-.2c-14.2-4.3-23.8-7.3-29.9-11.4c-2.6-1.8-3.4-3-3.6-3.5c-.2-.3-.7-1.6-.1-5c.3-1.9 1.9-5.2 8.2-8.1c6.4-2.9 16.4-4.5 28.6-2.6c4.3 .7 17.9 3.3 21.7 4.3c10.7 2.8 21.6-3.5 24.5-14.2s-3.5-21.6-14.2-24.5c-4.4-1.2-14.4-3.2-21-4.4l0-6.3c0-11.1-9-20.1-20.1-20.1zM48 352l16 0c19.5 25.9 44 47.7 72.2 64L64 416l0 32 192 0 192 0 0-32-72.2 0c28.2-16.3 52.8-38.1 72.2-64l16 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48z" /></svg></div>
                                    <div className="data-text">{currencySymbol}{sum.toFixed(2)}</div>
                                </div>
                                <div className="subtext">Unlockable Revenue</div>
                                <br />
                                <div className="data-block">
                                    <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96zM252 160c0 11 9 20 20 20l44 0 0 44c0 11 9 20 20 20s20-9 20-20l0-44 44 0c11 0 20-9 20-20s-9-20-20-20l-44 0 0-44c0-11-9-20-20-20s-20 9-20 20l0 44-44 0c-11 0-20 9-20 20z" /></svg></div>
                                    <div className="data-text">{currencySymbol}{recoveredSum.toFixed(2)}</div>
                                </div>
                                <div className="subtext">Recovered Revenue</div>
                            </div>

                            <div className="right-column">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item) => {
                                        let name = item.customer.first_name + item.customer.last_name;

                                        return (
                                            <div className="item-row" key={item.id}>
                                                <div className="item-icon"><svg style={{ width: '17px', height: '17px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" /></svg></div>
                                                <div style={{ width: '49%', marginRight: '5px' }}>{item.created_at ? item.created_at.split("T")[0] : 'N/A'}</div>

                                                <div style={{ width: '45%', marginRight: '5px' }}>{name ? name : 'N/A'}</div>
                                                <div style={{ width: '43%', marginRight: '5px' }}>{currencySymbol}{item.total_price || 'N/A'}</div>
                                                <div style={{ width: '15%', marginRight: '5px' }}>
                                                    {item.completed_at ? (
                                                        <svg style={{ width: '17px', height: '17px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" /></svg>
                                                    ) : (
                                                        <svg style={{ width: '17px', height: '17px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z" /></svg>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div>No abandoned checkouts found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Page>
    )

    async function handleFetchAbandonedCheckouts() {
        try {
            const response = await fetch("/api/abandoned-checkouts/get");
            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();
                setData(responseData?.data || []);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
}