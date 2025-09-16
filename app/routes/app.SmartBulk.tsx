import { Badge, Box, Button, Card, Link, Page, Select, SkeletonBodyText, Spinner, Text } from '@shopify/polaris'
import { useEffect, useState } from 'react';
import '../StartPage.css';
import { DateRangePicker } from '~/components/DateRangePicker'
import SmartBulkTable from '~/components/SmartBulkTable'
import ConfirmationModal from '~/components/ConfirmationModal';
import { isProPlanOrHigher } from '~/utils/plans';
import { useOutletContext } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import PullMoreCustomer from '~/components/SmartBulk/PullMoreCustomer';
import SaveBarComponent from '~/components/SaveBarComponent';

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

    const [customMessage, setCustomMessage] = useState<any>()
    const [compareMessage, setCompareMessage] = useState<any>()
    const [isSaveButtonLoading, setSaveButtonLoading] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [customers, setCustomers] = useState<any>([]);
    const [persistCustomers, setPersistCustomers] = useState<any>([]);
    const [selectedFilter, setSelectedFilter] = useState<string[]>(["updatedAt desc"]);
    const [queryValue, setQueryValue] = useState('');
    const [isTableLoading, setTableLoading] = useState(false)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [pageInfo, setPageInfo] = useState({
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: '',
        prevCursor: '',
        nextNameCursor: '',
        prevNameCursor: ''
    });
    const [PageSize, setPageSize] = useState('5')
    const { selectedPlanName, permissions }: any = useOutletContext()
    const [paginationDirection, setPaginationDirection] = useState('')
    const [isProUser, setIsProUser] = useState(false);

    useEffect(() => {
        const isClean = compareMessage?.header === customMessage?.header && compareMessage?.content === customMessage?.content
        if (isClean) {
            shopify.saveBar.hide('smart-bulk-save-bar');
        } else {
            shopify.saveBar.show('smart-bulk-save-bar');
        }
    }, [customMessage, compareMessage]);

    useEffect(() => {
        const proStatus = isProPlanOrHigher(selectedPlanName) || isProPlanOrHigher(permissions?.manualPlan);
        // console.log("proStatus", proStatus);
        setIsProUser(proStatus);
    }, [selectedPlanName, permissions]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (isProUser) {
                fetchPaginatedData();
            }
        }, 700);
        return () => clearTimeout(debounceTimer);
    }, [currentPage, isProUser]);

    useEffect(() => {

        setPaginationDirection('');
        setPageInfo({
            hasNextPage: false,
            hasPreviousPage: false,
            nextCursor: '',
            prevCursor: '',
            nextNameCursor: '',
            prevNameCursor: ''
        });
        setCurrentPage(prev => prev + 1);
    }, [PageSize, selectedDateValues, queryValue]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/getSmartBulkMessage')
                if (response.ok) {
                    const { messageData } = await response.json()
                    // console.log("messageData", messageData);
                    setCustomMessage(messageData)
                    setCompareMessage(messageData)
                }
            } catch (error) {
                console.log("error occured while fetching smartBulkMessage", error)
            } finally {
                setMessageLoading(false)
            }
        }
        fetchData()
    }, [])


    const fetchPaginatedData = async () => {
        // console.log("Fetching page:", page, "with cursor:", cursor);
        // console.log("queryValue", queryValue);
        try {
            if (!isTableLoading) {
                setTableLoading(true);
            }
            const response = await fetch('/api/getStoresCustomers', {
                method: "POST",
                body: JSON.stringify({
                    filterField: selectedDateValues.since ? "createdAt" : null,
                    filterValue: selectedDateValues,
                    search: queryValue,
                    limit: PageSize,
                    startAfter: pageInfo.nextCursor,
                    prevCursor: pageInfo.prevCursor,
                    nextNameCursor: pageInfo.nextNameCursor,
                    prevNameCursor: pageInfo.prevNameCursor,
                    paginationDirection: paginationDirection,
                }),
            });


            if (response.ok) {
                const data = await response.json();

                if (data?.customers) {
                    // console.log("Fetched data :", data);
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
                    setPageInfo({
                        hasNextPage: data.pageInfo.hasNextPage,
                        hasPreviousPage: data.pageInfo.hasPreviousPage,
                        nextCursor: data.pageInfo.nextCursor,
                        prevCursor: data.pageInfo.prevCursor,
                        nextNameCursor: data.pageInfo.nextNameCursor,
                        prevNameCursor: data.pageInfo.prevNameCursor
                    })
                }
                setTableLoading(false);
            }
        } catch (error) {
            console.error("Error fetching paginated data:", error);
        }

    };

    const handleSendMessageInitial = () => {
        const modal = document.getElementById('confirmation_modal_bulkMessage') as HTMLElement | null;
        if (modal) {
            (modal as any).show();
        }
    }

    const hideModal = () => {
        const modal = document.getElementById('confirmation_modal_bulkMessage') as HTMLElement | null;
        if (modal) {
            (modal as any).hide();
        }
    }

    const handleSendMessageConfirmed = async () => {
        // console.log("selectedTableData", selectedTableData);
        const topicNames = ["bulk_sending"]
        hideModal();
        const checkouts = selectedTableData.map((data: any) => {
            if (data && data?.id) {
                return {
                    name: data?.name,
                    phoneNumber: data?.phone,
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
            setSaveButtonLoading("doLoad")
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
            setSaveButtonLoading(null)
        }
    }

    const options = [
        { label: "5/page", value: '5' },
        { label: t("smartBulk.15perPageLabel"), value: '15' },
        { label: t("smartBulk.50perPageLabel"), value: '50' },
        { label: t("smartBulk.100perPageLabel"), value: '100' },
        { label: t("smartBulk.200perPageLabel"), value: '250' }
    ];

    const handleDiscardChanges = () => {
        setCustomMessage(compareMessage)
    }

    return (
        <div className='start_page smart-bulk padding_zero'>

            <Page fullWidth>
                <div className='mb-16 bulk-box'>
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
                                            setCustomMessage((prev: any) => ({
                                                ...prev,
                                                header: e.target.value
                                            }))
                                        }
                                        }
                                        placeholder={t("settings.messageBoxHeadingPlaceholder")}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    />
                                    <textarea
                                        className="w-full h-60 text-base border-none outline-none"
                                        value={customMessage?.content}
                                        onChange={(e) => {
                                            setCustomMessage((prev: any) => ({
                                                ...prev,
                                                content: e.target.value
                                            }))
                                        }}
                                        placeholder={t("settings.messageBoxContentPlaceholder")}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                    />
                                    {/* <div className='flex justify-end pr-3 pt-4'>
                                        <Button
                                            onClick={handleSaveMessage}
                                            variant="primary"
                                            disabled={compareMessage?.header === customMessage?.header && compareMessage?.content === customMessage?.content}
                                            loading={isSaveButtonLoading}
                                        >{t("settings.messageBoxSaveButton")}</Button>
                                    </div> */}
                                </div>}
                            </Card>
                        </div>
                    </div> : null}

                    <div className='mb-16 mt-5'>
                        <PullMoreCustomer
                            isProPlanOrHigher={isProPlanOrHigher(selectedPlanName) || isProPlanOrHigher(permissions?.manualPlan)}
                            t={t}
                        />
                    </div>

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
                            setSelectedFilter={setSelectedFilter}
                            customers={customers}
                            persistCustomers={persistCustomers}
                            currentPage={currentPage}
                            disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                            setCurrentPage={setCurrentPage}
                            pageInfo={pageInfo}
                            isTableLoading={isTableLoading}
                            setQueryValue={setQueryValue}
                            queryValue={queryValue}
                            setPaginationDirection={setPaginationDirection}
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
                    id="confirmation_modal_bulkMessage"
                />
                <SaveBarComponent
                    onSave={handleSaveMessage}
                    isLoading={isSaveButtonLoading}
                    onDiscard={handleDiscardChanges}
                    saveText={t("settings.messageBoxSaveButton")}
                    discardText="Discard"
                    variant="primary"
                    id="smart-bulk-save-bar"
                />
            </Page>
        </div>

    )
}
