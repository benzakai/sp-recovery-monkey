import {
    IndexTable,
    IndexFilters,
    useSetIndexFiltersMode,
    useIndexResourceState,
    useBreakpoints,
    EmptySearchResult
} from '@shopify/polaris';
import { useState, useCallback, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';


export default function SmartBulkTable({
    setSelectedTableData,
    sortSelected,
    segments,
    disabled,
    persistSegments,
    setCurrentPage,
    pageInfo,
    isTableLoading,
    queryValue,
    setQueryValue,
    fetchPaginatedData
}: any) {
    const { t } = useTranslation()
    const [selected, setSelected] = useState(0);
    const { mode, setMode } = useSetIndexFiltersMode();

    const onHandleCancel = () => { };

    const emptyStateMarkup = (
        <EmptySearchResult
            title={t("smartBulk.emptyListTitle")}
            description={t("smartBulk.emptyListDescription")}
            withIllustration
        />
    );

    const handleFiltersQueryChange = useCallback(
        (value: string) => {
            console.log("value", value);

            setQueryValue(value)
        },
        [],
    );

    const handleNext = () => {
        if (pageInfo.hasNextPage) {
            setCurrentPage((p: any) => p + 1);
            fetchPaginatedData("next");
        }
    };

    const handlePrevious = () => {
        if (pageInfo.hasPreviousPage) {
            setCurrentPage((p: any) => Math.max(1, p - 1));
            fetchPaginatedData("prev");
        }
    };



    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(segments);

    const handleSelectionChangeWithGuard = (
        selectionType: any,
        isSelecting: any,
        selection?: any,
        position?: number
    ) => {
        if (disabled) {
            shopify.toast.show(
                t("global.toastMessage.smartBulkNextWarning"),
                { isError: true }
            );
            return;
        }
        handleSelectionChange(selectionType, isSelecting, selection, position);
    };


    // useEffect(() => {
    //     console.log("selectedResources", selectedResources);
    //     setSelectedTableData(selectedResources)
    // }, [selectedResources])

    useEffect(() => {
        // console.log("selectedResources", selectedResources);
        const selectedResourcesSet = new Set(selectedResources);
        const filteredSelectedResources = persistSegments.filter((data: any) =>
            selectedResourcesSet.has(data.id)
        );
        // console.log("filteredSelectedResources", filteredSelectedResources);
        setSelectedTableData(filteredSelectedResources);
    }, [selectedResources]);

    const rowMarkup = segments.length ? segments.map(
        (
            { id, name }: any,
            index: any,
        ) => {
            return (
                <Fragment key={id}>
                    <IndexTable.Row
                        id={id}
                        key={id}
                        selected={selectedResources.includes(id)}
                        position={index}
                        disabled={disabled}
                    >
                        <IndexTable.Cell>
                            {name ? name : 'N/A'}
                        </IndexTable.Cell>

                    </IndexTable.Row>
                </Fragment>
            );
        }
    ) : []

    return (
        <>
            <IndexFilters
                // sortOptions={sortOptions}
                disabled={disabled}
                sortSelected={sortSelected}
                queryPlaceholder={t("smartBulk.segments.SearchPlaceholder")}
                onQueryChange={handleFiltersQueryChange}
                queryValue={queryValue}
                onQueryClear={() => setQueryValue('')}
                // onSort={(e) => {
                //     setSelectedFilter(e)
                // }}
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
                itemCount={segments.length}
                selectedItemsCount={
                    allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChangeWithGuard}
                emptyState={emptyStateMarkup}
                headings={[{ title: t("smartBulk.segments.tableColumn.name") }]}
                pagination={{
                    hasNext: pageInfo.hasNextPage,
                    hasPrevious: pageInfo.hasPreviousPage,
                    onNext: disabled
                        ? () =>
                            shopify.toast.show(
                                t("global.toastMessage.smartBulkNextWarning"),
                                { isError: true }
                            )
                        : handleNext,
                    onPrevious: disabled
                        ? () =>
                            shopify.toast.show(
                                t("global.toastMessage.smartBulkPreviousWarning"),
                                { isError: true }
                            )
                        : handlePrevious,
                }}
            >
                {rowMarkup}
            </IndexTable>

        </>
    );

}