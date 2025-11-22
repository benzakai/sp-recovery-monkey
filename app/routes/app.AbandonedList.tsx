import * as React from 'react';
import "../StartPage.css";
import '../AbandonedCarts.css';
import { Card, DataTable, Text, Select, Spinner } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { DateRangePicker } from '~/components/DateRangePicker';
import BlackFridaySaleBanner from '~/components/global/BlackFridaySaleBanner';

export default function NewAbandonedList() {
    const { t } = useTranslation();

    const [checkouts, setCheckouts] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState('5');
    const [loader, setLoader] = React.useState(true);

    const [selectedDateValues, setSelectedDateValues] = React.useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        return {
            since: sevenDaysAgo.toISOString().split('T')[0],
            until: today.toISOString().split('T')[0],
        };
    });

    const [pageInfo, setPageInfo] = React.useState({
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: '',
        prevCursor: '',
    });

    const fetchData = async (cursor: string | null = null, direction: 'next' | 'prev' = 'next') => {
        try {
            setLoader(true);
            const response = await fetch('/api/abandonedListCustomer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    limit: Number(itemsPerPage),
                    since: selectedDateValues.since,
                    until: selectedDateValues.until,
                    paginationDirection: direction,
                    cursor: direction === 'next' ? cursor : null,
                    prevCursor: direction === 'prev' ? cursor : null,
                }),
            });
            const data = await response.json();

            if (data.success && data.checkouts) {
                setCheckouts(data.checkouts);
                setPageInfo({
                    hasNextPage: data.pageInfo?.hasNextPage ?? false,
                    hasPreviousPage: data.pageInfo?.hasPreviousPage ?? false,
                    nextCursor: data.pageInfo?.nextCursor ?? '',
                    prevCursor: data.pageInfo?.prevCursor ?? '',
                });
            }
        } catch (error) {
            console.error('Error fetching abandoned carts:', error);
        } finally {
            setLoader(false);
        }
    };

    React.useEffect(() => {
        setCurrentPage(1);
        setPageInfo({ hasNextPage: false, hasPreviousPage: false, nextCursor: '', prevCursor: '' });
        fetchData(null, 'next');
    }, [itemsPerPage, selectedDateValues]);

    const handleNext = () => {
        if (pageInfo.hasNextPage) {
            setCurrentPage((p) => p + 1);
            fetchData(pageInfo.nextCursor, 'next');
        }
    };

    const handlePrevious = () => {
        if (pageInfo.hasPreviousPage) {
            setCurrentPage((p) => Math.max(1, p - 1));
            fetchData(pageInfo.prevCursor, 'prev');
        }
    };

    const rows = checkouts.map((item) => [
        <div>{item.dateTime ? new Date(item.dateTime).toLocaleString() : 'N/A'}</div>,
        <div>{item.name || 'Unknown'}</div>,
        <div>{item.currency}{item.totalPrice}</div>,
    ]);

    const options = [
        { label: "5/page", value: '5' },
        { label: t("smartBulk.15perPageLabel"), value: '15' },
        { label: t("smartBulk.50perPageLabel"), value: '50' },
        { label: t("smartBulk.100perPageLabel"), value: '100' },
        { label: t("smartBulk.200perPageLabel"), value: '250' }
    ];



    return (
        <div className="body">
            <div className='start_page padding_zero'>
                <div className='start_main_container abandoned_main_wrap'>

                    <BlackFridaySaleBanner
                        btnClass="saleBannerButton"
                        src={"/images/letsStartPage/topBanner.png"}
                        className='abandoned_banner_welcome_page cursor-pointer'
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
                                    onChange={(v) => setItemsPerPage(v)}
                                    value={itemsPerPage}
                                />
                                <DateRangePicker
                                    setSelectedDateValues={setSelectedDateValues}
                                    t={t}
                                    disabled={false}
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
                                    <Card padding={{ xs: '400', sm: '400' }}>
                                        <div className="abandoned_list_loading_state">
                                            <div className="loading_spinner_container skeleton-pulse">
                                                <Spinner accessibilityLabel="Loading abandoned carts" size="large" />
                                            </div>
                                            <div className="loading_text_container">
                                                <Text as="p" variant="bodyMd" alignment="center">
                                                    Loading checkouts...
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (

                                    <Card padding={{ xs: '190', sm: '190' }}>
                                        <DataTable
                                            columnContentTypes={['text', 'text', 'text']}
                                            headings={[
                                                t("abandonedList.tableColumnHeading1"),
                                                t("abandonedList.tableColumnHeading2"),
                                                t("abandonedList.tableColumnHeading3")
                                            ]}
                                            rows={rows}
                                            pagination={{
                                                hasNext: pageInfo.hasNextPage,
                                                hasPrevious: pageInfo.hasPreviousPage,
                                                onNext: handleNext,
                                                onPrevious: handlePrevious,
                                                label: `Page ${currentPage}`,
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