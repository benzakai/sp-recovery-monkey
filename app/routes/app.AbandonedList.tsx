import * as React from 'react';
import "../StartPage.css";
import '../AbandonedCarts.css'
import { Page, LegacyCard, DataTable, Icon, Text, Spinner, Card, SkeletonDisplayText } from '@shopify/polaris';
import AbandonedCartsSummary from '~/components/AbandonedCartsSummary';

function formatDate(dateString: any) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateParts = dateString.split(/[\s/:]/);
    const day = parseInt(dateParts[0], 10);
    const month = months[parseInt(dateParts[1], 10) - 1];
    const year = dateParts[2];
    const hour = dateParts[3];
    const minute = dateParts[4];
    const second = dateParts[5];

    return `${month} ${day} ${hour}:${minute}:${second}`;
}

function parseDate(dateString: any) {
    const [day, month, year, hour, minute, second] = dateString.split(/[\s/:]/).map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
}


export default function NewAbandonedList() {
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
    const itemsPerPage = 5;
    const [loader, setLoader] = React.useState(true);

    // const CrossiconContent = () => {
    //     return (
    //         <svg className='checkSVG' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
    //     );
    // };

    // const CheckiconContent = () => {
    //     return (
    //         <svg className='checkSVG' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
    //     );
    // };

    const sortedData = customerData.sort((a, b) => parseDate(b.DateTime).getTime() - parseDate(a.DateTime).getTime());
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
        handleFetchTableData();
    }, []);

    const GetDataRow: any = (currentItems ?? [])?.map((item: any) => [
        <div>{formatDate(item.DateTime)}</div>,
        <div>
            {item.Name}
        </div>,
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
            // console.log("responseData", responseData);
            if (responseData?.success && responseData?.abandonedListCustomer.length) {
                setCustomerData(responseData?.abandonedListCustomer);
            }
        } catch (error) {
            console.error("Error fetching abandoned carts:", error);
        } finally {
            setLoader(false)
        }
    }

    return (
        <div className="body">
            <div className='start_page'>
                <Page fullWidth>
                    <div className='start_main_container'>
                        <div className='abandoned_list_main_container_heading'>
                            <div className='start_main_container_sub_heading'>
                                <Text variant="heading3xl" as="h3">
                                    Abandoned carts
                                </Text>
                            </div>
                        </div>
                        <div><AbandonedCartsSummary getPageData={getPageData} forPageType="AbandonedList" /></div>

                        <div className='abandoned_list_container'>
                            <div className="start_price_container_heading">
                                <Text variant="headingLg" as="h5">
                                    Latest Cart Recovery Messages
                                </Text>
                            </div>

                            {loader ? (
                                <div className="flex justify-center items-center h-full w-full mt-28">
                                    <Spinner accessibilityLabel="Spinner example" size="large" />
                                </div>
                            ) : (
                                <Card
                                    padding={{ xs: '190', sm: '190' }}>
                                    <DataTable
                                        columnContentTypes={[
                                            'text',
                                            'text',
                                            'text'
                                        ]}
                                        headings={[
                                            'Time and Date',
                                            'Name',
                                            'Checkout price',
                                        ]}
                                        rows={GetDataRow}
                                        pagination={{
                                            hasNext: currentPage < totalPages,
                                            hasPrevious: currentPage > 1,
                                            onNext: handleNext,
                                            onPrevious: handlePrevious,
                                            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, customerData?.length)} of ${customerData?.length} Abandoned carts`,
                                        }}
                                    />
                                </Card>
                            )}
                        </div>
                    </div>
                </Page>
            </div>
        </div>
    )

    async function handleFetchAbandonedCheckouts() {
        try {
            // setLoader(true)
            // const appSubscription = await fetchAppSubscription();
            // console.log("appSubscription from abondonedList==========>>>", appSubscription);

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

            //.....................................//...................................//

            // const responseAbandoned = await fetch("/api/abandoned-checkouts/get", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         appSubscriptionCreated: appSubscription?.activeSubscriptions?.[0]?.createdAt,
            //         pageName: "WelcomeConnect",
            //         planType: "Free"
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
            //         abandonedCartsSum,
            //         allCarts
            //     }));
            // }
            // setLoader(false)
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error on AbandonedList ", error);
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
    //         console.log("fetchAppSubscription ERROR on AbandonedList", error);
    //     }
    // }
}