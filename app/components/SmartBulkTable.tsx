import {
    IndexTable,
    IndexFilters,
    useSetIndexFiltersMode,
    useIndexResourceState,
    Text,
    useBreakpoints,
    Card,
    Badge,
    EmptySearchResult
} from '@shopify/polaris';
import type { IndexFiltersProps } from '@shopify/polaris';
import { useState, useCallback, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const emptyStateMarkup = (
    <EmptySearchResult
        title={'No abandoned carts found'}
        description={'Try changing the filters or search term'}
        withIllustration
    />
);

export default function SmartBulkTable({
    setSelectedTableData,
    sortSelected,
    setSortSelected,
    customers,
    disabled,
    persistCustomers,
    currentPage,
    setCurrentPage,
    pageInfo,
    isTableLoading,
    queryValue,
    setQueryValue
}: any) {
    const { t } = useTranslation()
    const [selected, setSelected] = useState(0);
    const sortOptions: IndexFiltersProps['sortOptions'] = [
        { label: t("smartBulk.sortOption1"), value: 'lastUpdate asc', directionLabel: t("smartBulk.sortOptionDirection1A") },
        { label: t("smartBulk.sortOption1"), value: 'lastUpdate desc', directionLabel: t("smartBulk.sortOptionDirection1B") },
        { label: t("smartBulk.sortOption2"), value: 'subscription asc', directionLabel: t("smartBulk.sortOptionDirection1A") },
        { label: t("smartBulk.sortOption2"), value: 'subscription desc', directionLabel: t("smartBulk.sortOptionDirection1B") },
        { label: t("smartBulk.sortOption3"), value: 'revenue asc', directionLabel: t("smartBulk.sortOptionDirection2A") },
        { label: t("smartBulk.sortOption3"), value: 'revenue desc', directionLabel: t("smartBulk.sortOptionDirection2B") }
        // { label: 'Higher revenue', value: 'higherRevenue asc', directionLabel: 'Oldest to newest' },
        // { label: 'Higher revenue', value: 'higherRevenue desc', directionLabel: 'Newest to oldest' },
        // { label: 'Lowest revenue', value: 'lowestRevenue asc', directionLabel: 'Oldest to newest' },
        // { label: 'Lowest revenue', value: 'lowestRevenue desc', directionLabel: 'Newest to oldest' },
    ];
    const { mode, setMode } = useSetIndexFiltersMode();

    const onHandleCancel = () => { };

    const handleFiltersQueryChange = useCallback(
        (value: string) => {
            console.log("value", value);

            setQueryValue(value)
        },
        [],
    );

    const handleNext = () => {
        if (pageInfo.hasNextPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevious = () => {
        if (pageInfo.hasPreviousPage) {
            setCurrentPage(currentPage - 1);
        }
    };

    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(customers);

    // useEffect(() => {
    //     console.log("selectedResources", selectedResources);
    //     setSelectedTableData(selectedResources)
    // }, [selectedResources])

    useEffect(() => {
        // console.log("selectedResources", selectedResources);
        const selectedResourcesSet = new Set(selectedResources);
        const filteredSelectedResources = persistCustomers.filter((data: any) =>
            selectedResourcesSet.has(data.id)
        );
        // console.log("filteredSelectedResources", filteredSelectedResources);
        setSelectedTableData(filteredSelectedResources);
    }, [selectedResources]);

    const rowMarkup = customers.length ? customers.map(
        (
            { id, createdAt, firstName, lastName, phone, email, emailMarketingConsent, addresses, defaultAddress }: any,
            index: any,
        ) => {
            let foundPhoneNumber;
            const addressPhone = addresses.find((d: any) => d?.phone)?.phone
            if (phone) {
                foundPhoneNumber = phone;
            } else if (addressPhone) {
                foundPhoneNumber = addressPhone
            } else if (defaultAddress?.phone) {
                foundPhoneNumber = defaultAddress.phone
            }
            // console.log("foundPhoneNumber", foundPhoneNumber)
            // emailMarketingConsent = {
            //     ["marketingState"]: "SUBSCRIBED"
            // }
            return (
                <Fragment key={id}>
                    {/* {index === 0 && (
                        <IndexTable.Row
                            rowType="subheader"
                            id="total-row"
                            position={0}
                            disabled={index === 0}
                        >
                            <IndexTable.Cell colSpan={3} scope="colgroup" as="th">
                                <Text variant="headingSm" fontWeight="bold" as="h3">
                                    Total
                                </Text>
                            </IndexTable.Cell>
                            <IndexTable.Cell >
                                <Text variant="headingSm" fontWeight="bold" as="h3">
                                    {otherTableData?.shopCurrency}{otherTableData?.abandonedCartsSum}
                                </Text>
                            </IndexTable.Cell>
                        </IndexTable.Row>
                    )} */}
                    <IndexTable.Row
                        id={id}
                        key={id}
                        selected={selectedResources.includes(id)}
                        position={index}
                    >
                        <IndexTable.Cell>
                            <Text variant="bodyMd" fontWeight="bold" as="span">
                                {createdAt?.split("T")[0] || 'N/A'}
                            </Text>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                            {firstName || lastName
                                ? `${firstName || ''} ${lastName || ''}`.trim()
                                : email || 'N/A'}
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                            {foundPhoneNumber}
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                            <Badge
                                tone={emailMarketingConsent?.marketingState === "SUBSCRIBED" ? "success" : emailMarketingConsent?.marketingState === "UNSUBSCRIBED" ? "attention" : 'enabled'}
                            >
                                {((emailMarketingConsent?.marketingState === "SUBSCRIBED" || emailMarketingConsent?.marketingState === "UNSUBSCRIBED") && emailMarketingConsent?.marketingState)
                                    ?
                                    (emailMarketingConsent?.marketingState === "UNSUBSCRIBED" ? t("smartBulk.emailSubscription.unsubscribed") : t("smartBulk.emailSubscription.subscribed"))
                                    : t("smartBulk.emailSubscription.notSubscribed")}
                            </Badge>
                        </IndexTable.Cell>
                    </IndexTable.Row>
                </Fragment>
            );
        }
    ) : []

    return (
        <>
            <IndexFilters
                sortOptions={sortOptions}
                disabled={disabled}
                sortSelected={sortSelected}
                queryPlaceholder={t("smartBulk.searchCustomers")}
                onQueryChange={handleFiltersQueryChange}
                queryValue={queryValue}
                onQueryClear={() => setQueryValue('')}
                onSort={setSortSelected}
                // primaryAction={primaryAction}
                cancelAction={{
                    onAction: onHandleCancel,
                    disabled: false,
                    loading: false,
                }}
                tabs={[]}
                selected={selected}
                onSelect={setSelected}
                loading={isTableLoading}
                // canCreateNewView
                // onCreateNewView={onCreateNewView}
                filters={[]}
                // appliedFilters={appliedFilters}
                onClearAll={() => { }}
                mode={mode}
                setMode={setMode}
            />
            <IndexTable
                condensed={useBreakpoints().smDown}
                resourceName={resourceName}
                itemCount={customers.length}
                selectedItemsCount={
                    allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                emptyState={emptyStateMarkup}
                headings={[
                    { title: t("smartBulk.tableColumnHeading1") },
                    { title: t("smartBulk.tableColumnHeading2") },
                    { title: t("smartBulk.tableColumnHeading3") },
                    { title: t("smartBulk.tableColumnHeading4") }
                ]}
                pagination={{
                    hasNext: isTableLoading ? false : pageInfo.hasNextPage,
                    hasPrevious: isTableLoading ? false : pageInfo.hasPreviousPage,
                    onNext: disabled ? () => { shopify.toast.show(t("global.toastMessage.smartBulkNextWarning"), { isError: true }) } : handleNext,
                    onPrevious: disabled ? () => { shopify.toast.show(t("global.toastMessage.smartBulkPreviousWarning"), { isError: true }) } : handlePrevious,
                    // label: `${(currentPage - 1) * PageSize + 1}-${Math.min(currentPage * PageSize, totalCustomers)} of ${totalCustomers} Abandoned carts`,
                    label: "  "
                }}
            // loading={isTableLoading}
            >
                {rowMarkup}
            </IndexTable>
        </>
    );

}