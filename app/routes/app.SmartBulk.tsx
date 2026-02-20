import { Badge, Box, Button, Card, Link, Page, Select, SkeletonBodyText, Spinner, Text } from '@shopify/polaris'
import { useEffect, useState } from 'react';
import '../StartPage.css';
import SmartBulkTable from '~/components/SmartBulkTable'
import ConfirmationModal from '~/components/ConfirmationModal';
import { isProPlanOrHigher } from '~/utils/plans';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { useTranslation } from 'react-i18next';
import SaveBarComponent from '~/components/SaveBarComponent';
import WhatsappTest from '~/components/WelcomPage/WhatsappTest/WhatsappTest';
import { authenticate } from '~/shopify.server';
import '../components/SmartBulk/SmartBulk.css'
import TopSaleBanner from '~/components/global/TopSaleBanner';

export const loader = async ({ request }: any) => {
    try {
        const { admin, session } = await authenticate.admin(request)
        return { shop: session.shop }
    } catch (error) {
        console.log("error occured on app.welcomeconnect page loader", error)
        return {}
    }
}


export default function SmartBulk() {
    const { t } = useTranslation()
    const { shop }: any = useLoaderData()
    const [selectedTableData, setSelectedTableData] = useState([]);
    const [customMessage, setCustomMessage] = useState<any>()
    const [compareMessage, setCompareMessage] = useState<any>()
    const [isSaveButtonLoading, setSaveButtonLoading] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [segments, setSegments] = useState<any>([]);
    const [persistSegments, setPersistSegments] = useState<any>([]);
    const [selectedFilter, setSelectedFilter] = useState<string[]>(["updatedAt desc"]);
    const [queryValue, setQueryValue] = useState('');
    const [isTableLoading, setTableLoading] = useState(false)
    const [isMessageLoading, setMessageLoading] = useState(true)
    const [pageInfo, setPageInfo] = useState({
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
    });

    const [cursor, setCursor] = useState<{
        after: string | null;
        before: string | null;
    }>({
        after: null,
        before: null,
    });
    const [PageSize, setPageSize] = useState('5')
    const { selectedPlanName, permissions }: any = useOutletContext()
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
        if (isProUser) {
            fetchPaginatedData("next");
        }
    }, [isProUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCursor({ after: null, before: null });
            setCurrentPage(1);
            fetchPaginatedData("reset");
        }, 600);

        return () => clearTimeout(timer);
    }, [queryValue, PageSize]);


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


    const fetchPaginatedData = async (
        direction: "next" | "prev" | "reset" = "next"
    ) => {
        try {
            setTableLoading(true);

            const payload: any = {
                limit: Number(PageSize),
                search: queryValue,
                direction,
            };

            if (direction === "next" && cursor.after) {
                payload.after = cursor.after;
            }

            if (direction === "prev" && cursor.before) {
                payload.before = cursor.before;
            }

            if (direction === "reset") {
                payload.direction = "next";
            }

            const response = await fetch("/api/getSegments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) return;

            const data = await response.json();

            setSegments(data.segments);
            setPageInfo(data.pageInfo);
            setPersistSegments((prev: any[]) => {
                const map = new Map(prev.map(item => [item.id, item]));
                data.segments.forEach((item: any) => {
                    map.set(item.id, item);
                });
                return Array.from(map.values());
            });

            setCursor({
                after: data.pageInfo.endCursor,
                before: data.pageInfo.startCursor,
            });

        } catch (error) {
            console.error("Pagination error:", error);
        } finally {
            setTableLoading(false);
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
        hideModal();
        const response = await fetch("/api/sendBulkMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(selectedTableData),
        });

        if (!response.ok) return;
        // const data = await response.json();
        shopify.toast.show(
            "Messages are being sent in the background. You can safely continue working.",
            { duration: 5000 }
        );

        // console.log("data.....", data)
        // const topicNames = ["bulk_sending"]
        // hideModal();
        // const checkouts = selectedTableData.map((data: any) => {
        //     if (data && data?.id) {
        //         return {
        //             name: data?.name,
        //             phoneNumber: data?.phone,
        //         };
        //     }
        // });
        // // console.log("checkouts:", checkouts);
        // // return
        // const instanceResponse = await fetch('/api/getInstance');
        // const instanceResponseData = await instanceResponse.json();
        // const message = {
        //     checkouts,
        //     messageContent: customMessage,
        //     greenAPIId: instanceResponseData?.instance?.idInstance,
        //     storeId: instanceResponseData?.instance?.shop,
        //     greenAPIKey: instanceResponseData?.instance?.apiTokenInstance,
        //     greenAPIUrl: instanceResponseData?.instance.apiUrl,
        // }
        // // console.log("message", message);
        // // return
        // const response3 = await fetch('/api/sendPubSubData', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ message, topicNames }),
        // });
        // const data3 = await response3.json();
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

    const handleDiscardChanges = () => {
        setCustomMessage(compareMessage)
    }

    return (
        <div className='start_page smart-bulk padding_zero'>
            <div className='smart-bulk-wrap'>
                <Page fullWidth>
                    <div className='bulk-box SmartBulk_wrap'>
                        <div className='flex flex-col md:flex-row items-start justify-between md:gap-6'>
                            <div className='icon-block'>
                                <div
                                    className=""
                                // onClick={() => handleSelectCard(card.id)}
                                >
                                    <div className="mb-4">
                                        {/* <div className="banner_img mb-6">
                                            <TopSaleBanner
                                                btnClass="saleBannerButton"
                                                className='long_banner_smart_page'
                                            />
                                        </div> */}

                                        <div className='flex flex-row items-center gap-3 smartBulk_parent mb-[6px]'>
                                            <Text variant="headingLg" as="h5">
                                                {t("smartBulk.title")}
                                            </Text>
                                            <div className='smart_badge'>
                                                <Badge tone='info' >{t("settings.planName3")}</Badge>
                                            </div>
                                        </div>

                                        <p className="text-[13px]">
                                            {t("smartBulk.subtitle")}
                                        </p>
                                        {/* <div className='mb-5'></div>
                                        <Text variant="headingLg" fontWeight='regular' as="p">
                                            {t("smartBulk.messageBoxTitle")}
                                        </Text>
                                        <div className='mb-3'></div>
                                        <Text variant="bodyLg" as="p">
                                            {t("smartBulk.messageBoxDescription")} <Link removeUnderline>{t("smartBulk.messageBoxLinkText")}</Link>
                                        </Text> */}
                                    </div>
                                    <Card>
                                        <div className="w-[90%] md:w-[60%] bulk-cart-wrap">
                                            <div className='mb-4'>
                                                <p className="text-[13px] font-semibold">
                                                    {t("dashboard.messageBoxTitle")}
                                                </p>
                                            </div>
                                            <Card>
                                                {isMessageLoading ? <div className='spinn flex justify-center items-center h-72'>
                                                    <Spinner accessibilityLabel="Small spinner example" size="large" />
                                                </div> : <div className="flex-col" >
                                                    <textarea
                                                        className="w-full h-7 border-none outline-none text-base inner-txt"
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
                                                        className="w-full h-60 text-base border-none outline-none inner-txt"
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
                                            <WhatsappTest shop={shop} t={t} page="smartBulk" message={customMessage} />
                                        </div>
                                    </Card>

                                </div>

                                <div className='flex justify-between Smart_custom mt-10'>
                                    <div className='flex flex-row items-center gap-2 smartBulk_parent mb-[6px] '>
                                        <Text variant="headingLg" as="h5">
                                            {t("smartBulk.segments.title")}
                                        </Text>
                                        <div className='smart_badge'>
                                            <Badge tone='info' >Pro</Badge>
                                        </div>
                                    </div>

                                    <div className="flex Smart_custom_subtext">
                                        <p className="text-[13px]">
                                            {t("smartBulk.segments.description")}
                                        </p>
                                        <div className="Smart_custom_button mb-2">
                                            <Button
                                                variant="primary"
                                                disabled={(selectedTableData.length && (isProPlanOrHigher(selectedPlanName) || isProPlanOrHigher(permissions?.manualPlan))) ? false : true}
                                                onClick={handleSendMessageInitial}
                                            >
                                                {t("smartBulk.sendMessageButton")}
                                            </Button>
                                        </div>
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
                                        segments={segments}
                                        persistSegments={persistSegments}
                                        currentPage={currentPage}
                                        disabled={!isProPlanOrHigher(selectedPlanName) && !isProPlanOrHigher(permissions?.manualPlan)}
                                        setCurrentPage={setCurrentPage}
                                        pageInfo={pageInfo}
                                        isTableLoading={isTableLoading}
                                        setQueryValue={setQueryValue}
                                        queryValue={queryValue}
                                        fetchPaginatedData={fetchPaginatedData}
                                    />
                                    {/* } */}
                                </Card>
                            </div>
                        </div>
                    </div>
                    <ConfirmationModal
                        handlePrimaryClick={handleSendMessageConfirmed}
                        handleSecondClick={hideModal}
                        primaryButtonText={t("smartBulk.sendMessageButton")}
                        secondaryButtonText={t("smartBulk.cancelButton")}
                        content={t("smartBulk.segments.confirmationTitle")}
                        title={t("smartBulk.sendMessageButton")}
                        id="confirmation_modal_bulkMessage"
                    />
                    <SaveBarComponent
                        onSave={handleSaveMessage}
                        isLoading={isSaveButtonLoading}
                        onDiscard={handleDiscardChanges}
                        saveText={t("settings.messageBoxSaveButton")}
                        discardText={t("aiSettings.discard")}
                        variant="primary"
                        id="smart-bulk-save-bar"
                    />
                </Page>
            </div>
        </div>

    )
}
