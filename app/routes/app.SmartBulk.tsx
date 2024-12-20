import { Box, Button, Card, Link, Page, SkeletonBodyText, Spinner, Text } from '@shopify/polaris'
import { useEffect, useState } from 'react';
import { DateRangePicker } from '~/components/DateRangePicker'
import SmartBulkTable from '~/components/SmartBulkTable'
import ConfirmationModal from '~/components/ConfirmationModal';

const PageSize = 15;

interface Customer {
    id: string;
    createdAt: string;
    completedAt: string;
    updatedAt: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        emailMarketingConsent: {
            marketingState: string;
            consentUpdatedAt: string;
        };
    };
    totalPriceSet: {
        shopMoney: {
            amount: string;
        };
    };
    shippingAddress: {
        country: string;
    };
}

export default function SmartBulk() {
    const [selectedTableData, setSelectedTableData] = useState([]);
    const [selectedDateValues, setSelectedDateValues] = useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
    
        return {
            since: sevenDaysAgo.toISOString().split('T')[0],
            until: today.toISOString().split('T')[0]
        };
    });
    
    const [customMessage, setCustomMessage] = useState()
    const [compareMessage, setCompareMessage] = useState()
    const [otherTableData, setOtherTableData] = useState({
        abandonedCartsSum: 0,
        shopCurrency: null
    })
    const [isSaveButtonLoading, setSaveButtonLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1);
    const [copyOfCurrentPage, setCopyOfCurrentPage] = useState(1)
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string[]>(["revenue asc"]);
    const [queryValue, setQueryValue] = useState('');
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [isTableLoading, setTableLoading] = useState(false)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [pageInfo, setPageInfo] = useState({
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null
    });

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            // console.log("selectedDateValues", selectedDateValues);
            if (!selectedFilter[0].includes("subscription")) {
                fetchPaginatedData();
            }
        }, 700);
        return () => {
            clearTimeout(debounceTimer);
        };
    }, [currentPage, selectedDateValues, queryValue, selectedFilter]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/getSmartBulkMessage')
            if (response.ok) {
                const { messageData } = await response.json()
                console.log("messageData", messageData);
                setCustomMessage(messageData)
                setCompareMessage(messageData)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (customMessage?.header) {
            setMessageLoading(false)
        }
    }, [customMessage])

    const fetchPaginatedData = async () => {
        // console.log("Fetching page:", page, "with cursor:", cursor);
        try {
            if (!isTableLoading) {
                setTableLoading(true);
            }
            const endCursorToFetch = currentPage > copyOfCurrentPage ? pageInfo.endCursor : null
            const startCursorToFetch = currentPage < copyOfCurrentPage ? pageInfo.startCursor : null
            setCopyOfCurrentPage(currentPage)
            const response = await fetch('/api/smartBulkAbandonedCarts', {
                method: "POST",
                body: JSON.stringify({
                    initialRender: ((!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) || currentPage === copyOfCurrentPage) ? true : false,
                    endCursor: endCursorToFetch,
                    startCursor: startCursorToFetch,
                    PageSize,
                    selectedDateValues,
                    queryValue,
                    selectedFilter: selectedFilter[0],
                    clientSideDate: new Date()
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched data:", data);

                if (data?.abandonedCheckouts) {
                    setCustomers(data.abandonedCheckouts)
                    setTotalCustomers(data.totalCount || 0);
                    setOtherTableData({
                        abandonedCartsSum: data.abandonedCartsSum,
                        shopCurrency: data.shopCurrency
                    })
                    setPageInfo({
                        hasNextPage: data.pageInfo.hasNextPage,
                        hasPreviousPage: data.pageInfo.hasPreviousPage,
                        endCursor: data.pageInfo.endCursor,
                        startCursor: data.pageInfo.startCursor
                    })
                }
                setTableLoading(false);
            }
        } catch (error) {
            console.error("Error fetching paginated data:", error);
        }

    };

    // const sortData = (data: Customer[]) => {
    //     if (selectedFilter.includes("lastUpdate asc")) {
    //         const sortedCustomers = [...data].sort((a, b) => {
    //             return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    //         });
    //         setCustomers(sortedCustomers);
    //     } else if (selectedFilter.includes("lastUpdate desc")) {
    //         const sortedCustomers = [...data].sort((a, b) => {
    //             return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    //         });
    //         setCustomers(sortedCustomers);
    //     } else if (selectedFilter.includes("lastUpdate asc")) {
    //         const sortedCustomers = [...data].sort((a, b) => {
    //             return new Date(a.customer.emailMarketingConsent.consentUpdatedAt).getTime() - new Date(b.customer.emailMarketingConsent.consentUpdatedAt).getTime();
    //         });
    //         setCustomers(sortedCustomers);
    //     } else if (selectedFilter.includes("lastUpdate desc")) {
    //         const sortedCustomers = [...data].sort((a, b) => {
    //             return new Date(b.customer.emailMarketingConsent.consentUpdatedAt).getTime() - new Date(b.customer.emailMarketingConsent.consentUpdatedAt).getTime();
    //         });
    //         setCustomers(sortedCustomers);
    //     }
    // };

    // useEffect(() => {
    //     sortData(customers)
    // }, [selectedFilter])

    // useEffect(() => {
    //     console.log("selectedTableData", selectedTableData);
    //     console.log("selectedDateValues", selectedDateValues);
    //     console.log("selectedFilter", selectedFilter);

    // }, [selectedTableData, selectedDateValues, selectedFilter])

    const handleSendMessageInitial = () => {
        const modal = document.getElementById('confirmation_modal') as HTMLElement | null;
        if (modal) {
            (modal as any).show();
        }
    }

    const hideModal = () => {
        const modal = document.getElementById('confirmation_modal') as HTMLElement | null;
        if (modal) {
            (modal as any).hide();
        }
    }

    const handleSendMessageConfirmed = async () => {
        console.log("selectedTableData", selectedTableData);
        const topicNames = ["bulk_sending"]
        hideModal();
        const checkouts = selectedTableData.map(selectedId => {
            const customer = customers.find(cust => cust.id === selectedId);
            console.log("customer", customer);

            if (customer && customer.customer) {
                return {
                    name: (customer.customer.firstName && customer.customer.lastName) ? customer.customer.firstName + " " + customer.customer.lastName : "N/A",
                    phoneNumber: customer.customer.phone ? customer.customer.phone : "N/A"
                };
            }
        });
        console.log("checkouts:", checkouts);
        // return
        const instanceResponse = await fetch('/api/getInstances');
        const instanceResponseData = await instanceResponse.json();
        const unauthorizedInstance = instanceResponseData.instances.find((instance: any) => instance.status === 'notAuthorized');
        const phoneNumberResponse = await fetch('/api/fetchPhoneNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(unauthorizedInstance),
        });
        const phoneNumberResponseData = await phoneNumberResponse.json();
        const message = {
            messageContent: customMessage,
            checkouts,
            greenAPIId: unauthorizedInstance.idInstance,
            storeId: phoneNumberResponseData?.storeId,
            // phoneNumber: phoneNumberResponseData?.reponseData?.phone,
            greenAPIKey: unauthorizedInstance?.apiTokenInstance,
            greenAPIUrl: unauthorizedInstance.apiUrl,
        }
        const response3 = await fetch('/api/sendPubSubData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, topicNames }),
        });
        const data3 = await response3.json();
        console.log("data3", data3);

    }

    const handleSaveMessage = async () => {
        try {
            setSaveButtonLoading(true)
            // console.log("message from handleSaveMessage", customMessage);
            const response = await fetch('/api/saveSmartBulkMessage', {
                method: 'POST',
                body: JSON.stringify(customMessage)
            })
            if (response.ok) {

                setCompareMessage(customMessage)
            }
        } catch (error) {
            console.log("error occured on handleSaveMessage", error);

        } finally {
            setSaveButtonLoading(false)
        }
    }

    return (
        <Page fullWidth>
            <div className='px-36 mt-10 mb-16'>
                {true ? <div
                    className=""
                // onClick={() => handleSelectCard(card.id)}
                >
                    <div className="mb-8">
                        <Text variant="heading3xl" as="h3">
                            Smart Bulk
                        </Text>
                        <Text variant="headingXl" as="h4">
                            Boost your sales with custom messages to multiple customers
                        </Text>
                        <div className='mb-5'></div>
                        <Text variant="headingLg" fontWeight='regular' as="p">
                            {`Choose the text that suits you best-> Edit the text to fit your needs-> Click "Save"`}
                        </Text>
                        <div className='mb-3'></div>
                        <Text variant="bodyLg" as="p">
                            You can use the following article for crafting winning and conversion phrasing at the <Link removeUnderline>link here.</Link>
                        </Text>
                    </div>
                    <div className="w-1/2 mb-20">
                        <Card>
                            {isMessageLoading ? <div className='flex justify-center items-center h-72'>
                                <Spinner accessibilityLabel="Small spinner example" size="large" />
                            </div> : <div className="flex-col" >
                                <textarea
                                    className="w-full h-7 border-none outline-none text-base"
                                    value={customMessage?.header}
                                    onChange={(e) => {
                                        setCustomMessage((prev) => ({
                                            ...prev,
                                            header: e.target.value
                                        }))
                                    }
                                    }
                                    placeholder="Heading"
                                />
                                <textarea
                                    className="w-full h-56 text-base border-none outline-none"
                                    value={customMessage?.content}
                                    onChange={(e) => {
                                        setCustomMessage((prev) => ({
                                            ...prev,
                                            content: e.target.value
                                        }))
                                    }}
                                    placeholder="Please write your content here..."
                                />
                                <div className='flex justify-end pr-3 pt-4'>
                                    <Button
                                        onClick={handleSaveMessage}
                                        variant="primary"
                                        disabled={compareMessage?.header === customMessage?.header && compareMessage?.content === customMessage?.content}
                                        loading={isSaveButtonLoading}
                                    >Save Text</Button>
                                </div>
                            </div>}
                        </Card>
                    </div>
                </div> : null}
                <div className='flex justify-between'>
                    <div className='mb-6'>
                        <Text variant="headingLg" as="p">
                            Overview of Customers with Abandoned Carts
                        </Text>
                        <div className='mb-2'></div>
                        <Text variant="bodyLg" as="p">
                            Select multiple users in bulk with checkboxes, then click 'Send Message'
                        </Text>
                    </div>
                    <div className='flex justify-center items-center'>
                        <div className='mr-3'>
                            <DateRangePicker
                                setSelectedDateValues={setSelectedDateValues} />
                        </div>
                        <Button
                            variant="primary"
                            disabled={(selectedTableData.length && customMessage?.content && customMessage?.header) ? false : true}
                            onClick={handleSendMessageInitial}
                        >
                            Send Message
                        </Button>
                    </div>
                </div>
                <Card
                    padding={{ xs: '190', sm: '190' }}
                >
                    {/* {isTableLoading ?
                        <Box paddingBlockStart="200">
                            <SkeletonBodyText lines={20} />
                        </Box>
                        : */}
                    <SmartBulkTable
                        setSelectedTableData={setSelectedTableData}
                        sortSelected={selectedFilter}
                        setSortSelected={setSelectedFilter}
                        customers={customers}
                        currentPage={currentPage}
                        PageSize={PageSize}
                        totalCustomers={totalCustomers}
                        setCurrentPage={setCurrentPage}
                        otherTableData={otherTableData}
                        pageInfo={pageInfo}
                        isTableLoading={isTableLoading}
                        setQueryValue={setQueryValue}
                        queryValue={queryValue}
                    />
                    {/* } */}
                </Card>
            </div>
            <ConfirmationModal
                handlePrimaryClick={handleSendMessageConfirmed}
                handleSecondClick={hideModal}
                primaryButtonText={"Send Message"}
                secondaryButtonText={"Cancel"}
                content={"Are you sure you want to send the message to the selected customers?"}
                title={"Send Message"}
            />
        </Page>
    )
}
