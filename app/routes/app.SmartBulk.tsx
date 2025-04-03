import { Badge, Box, Button, Card, Link, Page, Select, SkeletonBodyText, Spinner, Text } from '@shopify/polaris'
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { DateRangePicker } from '~/components/DateRangePicker'
import SmartBulkTable from '~/components/SmartBulkTable'
import ConfirmationModal from '~/components/ConfirmationModal';
import { isProPlanOrHigher } from '~/utils/plans';
import { useOutletContext } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

export default function SmartBulk() {
    const { t } = useTranslation()
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
    const [customers, setCustomers] = useState<any>([]);
    const [persistCustomers, setPersistCustomers] = useState<any>([]);
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
    const [PageSize, setPageSize] = useState('10')
    const { selectedPlanName, permissions }: any = useOutletContext()


    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            // console.log("selectedDateValues", selectedDateValues);
            // if (!selectedFilter[0].includes("subscription")) {
                // console.log("inside if ");
                fetchPaginatedData();
            // }
        }, 700);
        return () => {
            clearTimeout(debounceTimer);
        };
    }, [currentPage, selectedDateValues, queryValue, selectedFilter, PageSize]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/getSmartBulkMessage')
            if (response.ok) {
                const { messageData } = await response.json()
                // console.log("messageData", messageData);
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
            const response = await fetch('/api/customersWithPhoneNumbers', {
                method: "POST",
                body: JSON.stringify({
                    initialRender: ((!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) || currentPage === copyOfCurrentPage) ? true : false,
                    endCursor: endCursorToFetch,
                    startCursor: startCursorToFetch,
                    PageSize: Number(PageSize),
                    selectedDateValues,
                    queryValue,
                    selectedFilter: selectedFilter[0],
                    clientSideDate: new Date()
                }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data?.customers) {
                    // console.log("Fetched data of customersWithPhoneNumbers:", data.customers);
                    setCustomers(data.customers)
                    const filteredCustomers = data?.customers?.filter((d: any) =>
                        !persistCustomers.some((pd: any) => pd.id === d.id)
                    );
                    // console.log("filteredCustomers", filteredCustomers)
                    // const filteredCustomers = data.customers.filter
                    setPersistCustomers((pre: any) => ([
                        ...pre,
                        ...filteredCustomers
                    ]))
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
        // console.log("selectedTableData", selectedTableData);
        const topicNames = ["bulk_sending"]
        hideModal();
        const checkouts = selectedTableData.map((data: any) => {
            if (data && data.id) {
                let foundPhoneNumber;
                const addressPhone = data.addresses.find((d: any) => d.phone)?.phone
                if (data?.phone) {
                    foundPhoneNumber = data.phone;
                } else if (addressPhone) {
                    foundPhoneNumber = addressPhone
                } else if (data?.defaultAddress?.phone) {
                    foundPhoneNumber = data.defaultAddress.phone
                }
                return {
                    name: (data.firstName || data.lastName) ? (data.firstName ? `${data.firstName} ` : "") + (data.lastName || "") : "N/A",
                    phoneNumber: foundPhoneNumber ? foundPhoneNumber : "N/A",
                };
            }
        });
        // console.log("checkouts:", checkouts);
        // return
        const instanceResponse = await fetch('/api/getInstance');
        const instanceResponseData = await instanceResponse.json();
        const message = {
            checkouts,
            messageContent: customMessage,
            greenAPIId: instanceResponseData?.instance?.idInstance,
            storeId: instanceResponseData?.instance?.shop,
            greenAPIKey: instanceResponseData?.instance?.apiTokenInstance,
            greenAPIUrl: instanceResponseData?.instance.apiUrl,
        }
        // console.log("message", message);
        // return
        const response3 = await fetch('/api/sendPubSubData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, topicNames }),
        });
        const data3 = await response3.json();
        // console.log("data3", data3);
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

    const options = [
        { label: t("smartBulk.15perPageLabel"), value: '15' },
        { label: t("smartBulk.50perPageLabel"), value: '50' },
        { label: t("smartBulk.100perPageLabel"), value: '100' },
        { label: t("smartBulk.200perPageLabel"), value: '250' }
    ];

    return (
        <div className='start_page smart-bulk'>

            <Page fullWidth>
                <div className='mt-10 mb-16 bulk-box'>
                    {true ? <div
                        className=""
                    // onClick={() => handleSelectCard(card.id)}
                    >
                        <div className="mb-8">
                            <div className='flex flex-row gap-3'>
                                <Text variant="heading3xl" as="h3">
                                    {t("smartBulk.title")}
                                </Text>
                                <div className='pt-3.5'>
                                    <Badge tone='info' >Pro</Badge>
                                </div>
                            </div>
                            <Text variant="headingXl" as="h4">
                                {t("smartBulk.subtitle")}
                            </Text>
                            <div className='mb-5'></div>
                            <Text variant="headingLg" fontWeight='regular' as="p">
                                {t("smartBulk.messageBoxTitle")}
                            </Text>
                            <div className='mb-3'></div>
                            <Text variant="bodyLg" as="p">
                                {t("smartBulk.messageBoxDescription")} <Link removeUnderline>{t("smartBulk.messageBoxLinkText")}</Link>
                            </Text>
                        </div>
                        <div className="w-1/2 mb-20 cust-detail">
                            <Card>
                                {isMessageLoading ? <div className='spinn flex justify-center items-center h-72'>
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
                                        placeholder={t("settings.messageBoxHeadingPlaceholder")}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
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
                                        placeholder={t("settings.messageBoxContentPlaceholder")}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    />
                                    <div className='flex justify-end pr-3 pt-4'>
                                        <Button
                                            onClick={handleSaveMessage}
                                            variant="primary"
                                            disabled={compareMessage?.header === customMessage?.header && compareMessage?.content === customMessage?.content}
                                            loading={isSaveButtonLoading}
                                        >{t("settings.messageBoxSaveButton")}</Button>
                                    </div>
                                </div>}
                            </Card>
                        </div>
                    </div> : null}
                    <div className='flex justify-between'>
                        <div className='mb-6'>
                            <div className='flex flex-row gap-2'>
                                <Text variant="headingLg" as="p">
                                    {t("smartBulk.customersTableTitle")}
                                </Text>
                                <div>
                                    <Badge tone='info' >Pro</Badge>
                                </div>
                            </div>
                            <div className='mb-2'></div>
                            <Text variant="bodyLg" as="p">
                                {t("smartBulk.customersTableDescription")}
                            </Text>
                        </div>
                        <div className='flex justify-center items-center'>
                            <div className='mr-3'>
                                <Select
                                    label={t("smartBulk.show")}
                                    labelInline
                                    options={options}
                                    onChange={(v) => setPageSize(v)}
                                    value={PageSize}
                                    disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                />
                            </div>
                            <div className='mr-3'>
                                <DateRangePicker
                                    disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    setSelectedDateValues={setSelectedDateValues} t={t} />
                            </div>
                            <Button
                                variant="primary"
                                disabled={(selectedTableData.length && customMessage?.content && customMessage?.header && (isProPlanOrHigher(selectedPlanName) || isProPlanOrHigher(permissions?.manualPlan))) ? false : true}
                                onClick={handleSendMessageInitial}
                            >
                                {t("smartBulk.sendMessageButton")}
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
                            persistCustomers={persistCustomers}
                            currentPage={currentPage}
                            disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                            setCurrentPage={setCurrentPage}
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
                    primaryButtonText={t("smartBulk.sendMessageButton")}
                    secondaryButtonText={t("smartBulk.cancelButton")}
                    content={t("smartBulk.sendConfirmationDescription")}
                    title={t("smartBulk.sendMessageButton")}
                />
            </Page>
        </div>

    )
}
