import * as React from 'react';
import "../StartPage.css";
import '../AbandonedCarts.css'
import { DataTable, Text, Spinner, Card, Select } from '@shopify/polaris';
import AbandonedCartsSummary from '~/components/AbandonedCartsSummary';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@remix-run/react';
import { DateRangePicker } from '~/components/DateRangePicker';


// function parseDate(dateString: any) {
//     const [day, month, year, hour, minute, second] = dateString.split(/[\s/:]/).map(Number);
//     return new Date(year, month - 1, day, hour, minute, second);
// }

function parseDate(dateStr: any) {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');

    const fullYear = year.length === 2 ? `20${year}` : year;

    return new Date(`${fullYear}-${month}-${day}T${timePart}`);
}

export default function NewAbandonedList() {
    const { t } = useTranslation()
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
    const [customerData, setCustomerData] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [loader, setLoader] = React.useState(true);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [selectedDateValues, setSelectedDateValues] = React.useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        return {
            since: sevenDaysAgo.toISOString().split('T')[0],
            until: today.toISOString().split('T')[0]
        };
    });
    const filteredData = React.useMemo(() => {
        if (!selectedDateValues?.since || !selectedDateValues?.until) return customerData;

        const since = new Date(selectedDateValues.since);
        const until = new Date(selectedDateValues.until);
        until.setHours(23, 59, 59, 999);

        return customerData.filter((item: any) => {
            const itemDate = parseDate(item.DateTime);
            return itemDate >= since && itemDate <= until;
        });
    }, [customerData, selectedDateValues]);

    const sortedData = React.useMemo(() => {
        return [...filteredData].sort((a, b) => parseDate(b.DateTime).getTime() - parseDate(a.DateTime).getTime());
    }, [filteredData]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const navigate = useNavigate();

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedDateValues]);

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
        handleFetchTableData();
    }, []);


    function formatDate(dateString: any) {
        const dateParts = dateString.split(/[\s/:]/);
        const day = parseInt(dateParts[0], 10);
        const monthIndex = parseInt(dateParts[1], 10) - 1;
        const year = dateParts[2];
        const hour = dateParts[3];
        const minute = dateParts[4];
        const second = dateParts[5];
        const month = t(`global.monthsShort.${monthIndex}`);
        return `${month} ${day} ${hour}:${minute}:${second}`;
    }

    const GetDataRow: any = (currentItems ?? [])?.map((item: any) => [
        <div>{formatDate(item.DateTime)}</div>,
        <div>{item.Name}</div>,
        <div className='abandoned_list_price'>{item?.["Total Price"] ? (item.Currency ?? "") : ""}{(item?.["Total Price"] ?? "N/A")}</div>,
    ]);

    async function handleFetchTableData() {
        try {
            const response = await fetch("/api/abandonedListCustomer", {
                method: "POST",
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error("Failed to fetch abandonedListCustomer", response.status);
                return;
            }

            const responseData = await response.json();
            if (responseData?.success && responseData?.abandonedListCustomer.length) {
                setCustomerData(responseData?.abandonedListCustomer);
            }
        } catch (error) {
            console.error("Error fetching abandoned carts:", error);
        } finally {
            setLoader(false)
        }
    }

    async function handleFetchAbandonedCheckouts() {
        try {
            const responseCards = await fetch("/api/welcome-page/cards-data", {
                method: "GET",
            });
            if (!responseCards.ok) {
                console.error("failed to fetch cards data", responseCards.status);
                return;
            }
            const responseCardsData = await responseCards.json();
            if (responseCardsData?.success && responseCardsData?.dashboardData) {
                const { acr, sales_count, sum_of_sales, currency, checkout_count } = responseCardsData?.dashboardData;
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
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error on AbandonedList ", error);
        }
    }

    const options = [
        { label: "5/page", value: '5' },
        { label: t("smartBulk.15perPageLabel"), value: '15' },
        { label: t("smartBulk.50perPageLabel"), value: '50' },
        { label: t("smartBulk.100perPageLabel"), value: '100' },
        { label: t("smartBulk.200perPageLabel"), value: '250' }
    ];

    const handleBannerClick = () => {
        navigate("/app/Settings")
    }

    return (
        <div className="body">
            <div className='start_page padding_zero'>
                <div className='start_main_container abandoned_main_wrap'>
                    <img
                        onClick={handleBannerClick}
                        className="abandoned_banner_welcome_page"
                        src="/images/letsStartPage/topBanner.png"
                        alt="Banner"
                    />

                    <div className='mt-6 mb-4'>
                        <div className='start_main_container_sub_heading'>
                            <Text variant="headingLg" as="h5">
                                {t('abandonedList.title')}
                            </Text>
                        </div>
                        <div className='md:flex md:justify-between'>
                            <p className='text-[13px] md:text-left mt-[6px]'>
                                {t("abandonedList.latestCartRecovery")}
                            </p>
                            <div className="flex justify-end items-end gap-4 flex-wrap mt-4 md:mt-0">
                                <Select
                                    label={t("smartBulk.show")}
                                    labelInline
                                    options={options}
                                    onChange={(v: string) => {
                                        setCurrentPage(1);
                                        setItemsPerPage(Number(v))
                                    }}
                                    value={itemsPerPage.toString()}
                                />
                                <DateRangePicker
                                    setSelectedDateValues={setSelectedDateValues} t={t} disabled={false}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                    // className='abandoned_list_top_section'
                    >
                        <div>
                            {/* <div><AbandonedCartsSummary getPageData={getPageData} forPageType="AbandonedList" /></div> */}

                            <div className='abandoned_list_container'>
                                {/* <div className="mt-6 mb-4">
                                    <Text variant="headingLg" as="h5">
                                        {t("abandonedList.latestCartRecovery")}
                                    </Text>
                                    <p className='text-[13px] md:text-left mt-[6px] mb-4'>
                                        
                                    </p>
                                </div> */}

                                {loader ? (
                                    <div className="flex justify-center items-center h-full w-full mt-28">
                                        <Spinner accessibilityLabel="Spinner example" size="large" />
                                    </div>
                                ) : (

                                    <Card padding={{ xs: '190', sm: '190' }}>
                                        <DataTable
                                            columnContentTypes={['text', 'text', 'text']}
                                            headings={[
                                                t("abandonedList.tableColumnHeading1"),
                                                t("abandonedList.tableColumnHeading2"),
                                                t("abandonedList.tableColumnHeading3"),
                                            ]}
                                            rows={GetDataRow}
                                            pagination={{
                                                hasNext: currentPage < totalPages,
                                                hasPrevious: currentPage > 1,
                                                onNext: handleNext,
                                                onPrevious: handlePrevious,
                                                label: t("abandonedList.paginationText", {
                                                    currentPage: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                                                        currentPage * itemsPerPage,
                                                        filteredData?.length
                                                    )}`,
                                                    totalPages: filteredData?.length,
                                                }),

                                            }}
                                        />
                                    </Card>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}