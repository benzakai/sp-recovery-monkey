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
    otherTableData,
    currentPage,
    PageSize,
    totalCustomers,
    setCurrentPage,
    pageInfo,
    isTableLoading,
    queryValue,
    setQueryValue
}: any) {
    const [selected, setSelected] = useState(0);
    const sortOptions: IndexFiltersProps['sortOptions'] = [
        { label: 'Last update', value: 'lastUpdate asc', directionLabel: 'Oldest to newest' },
        { label: 'Last update', value: 'lastUpdate desc', directionLabel: 'Newest to oldest' },
        { label: 'Subscription', value: 'subscription asc', directionLabel: 'Oldest to newest' },
        { label: 'Subscription', value: 'subscription desc', directionLabel: 'Newest to oldest' },
        { label: 'Revenue', value: 'revenue asc', directionLabel: 'Highest to lowest' },
        { label: 'Revenue', value: 'revenue desc', directionLabel: 'Lowest to highest' }
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

    useEffect(() => {
        console.log("selectedResources", selectedResources);
        setSelectedTableData(selectedResources)
    }, [selectedResources])

    const rowMarkup = customers.length ? customers.map(
        (
            { createdAt, id, customer, totalPriceSet }: any,
            index: any,
        ) => {
            // if (customer?.emailMarketingConsent) {
            //     customer.emailMarketingConsent.marketingState = "UNSUBSCRIBED";
            // }
            return (
                <Fragment key={id}>
                    {index === 0 && (
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
                    )}
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
                            {customer?.firstName || customer?.lastName
                                ? `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()
                                : customer?.email || 'N/A'}
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                            <Badge
                                tone={customer?.emailMarketingConsent?.marketingState === "SUBSCRIBED" ? "success" : customer?.emailMarketingConsent?.marketingState === "UNSUBSCRIBED" ? "attention" : 'enabled'}
                            >
                                {((customer?.emailMarketingConsent?.marketingState === "SUBSCRIBED" || customer?.emailMarketingConsent?.marketingState === "UNSUBSCRIBED") && customer?.emailMarketingConsent?.marketingState) ? customer?.emailMarketingConsent?.marketingState.charAt(0).toUpperCase() + customer?.emailMarketingConsent?.marketingState.slice(1).toLowerCase() : "Not subscribed"}
                            </Badge>
                        </IndexTable.Cell>
                        <IndexTable.Cell>
                            {otherTableData.shopCurrency}{totalPriceSet?.shopMoney?.amount}
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
                sortSelected={sortSelected}
                queryPlaceholder="Search Customers"
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
                    { title: 'Date' },
                    { title: 'Name' },
                    { title: 'Email subscription' },
                    { title: 'Revenue' }
                ]}
                pagination={{
                    hasNext: isTableLoading ? false : pageInfo.hasNextPage,
                    hasPrevious: isTableLoading ? false : pageInfo.hasPreviousPage,
                    onNext: handleNext,
                    onPrevious: handlePrevious,
                    label: `${(currentPage - 1) * PageSize + 1}-${Math.min(currentPage * PageSize, totalCustomers)} of ${totalCustomers} Abandoned carts`,
                }}
            // loading={isTableLoading}
            >
                {rowMarkup}
            </IndexTable>
        </>
    );

}