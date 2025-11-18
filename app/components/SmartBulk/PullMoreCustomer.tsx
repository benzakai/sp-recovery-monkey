import React, { useState } from 'react'
import { DateRangePicker } from '../DateRangePicker'
import { Badge, Button, Text } from '@shopify/polaris';
import ConfirmationModal from '../ConfirmationModal';

export default function PullMoreCustomer({ isProPlanOrHigher, t }: any) {
    const [selectedDateValues, setSelectedDateValues] = useState(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        return {
            since: sevenDaysAgo.toISOString().split('T')[0],
            until: today.toISOString().split('T')[0]
        };
    });

    const handleSyncMoreCustomers = async () => {
        hideModal();
        shopify.toast.show(t("global.toastMessage.SyncProcessStartedMessage"), {
            duration: 10000,
        });
        try {
            const response = await fetch('/api/sync/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dateRange: selectedDateValues,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                // console.log("Sync Customers Response", data);
            }
        } catch (error) {
            console.error("Error syncing customers:", error);
        }
    }

    const showModal = () => {
        const modal = document.getElementById('confirmation_modal_pull_more_customers') as HTMLElement | null;
        if (modal) {
            (modal as any).show();
        }
    }
    const hideModal = () => {
        const modal = document.getElementById('confirmation_modal_pull_more_customers') as HTMLElement | null;
        if (modal) {
            (modal as any).hide();
        }
    }


    return (
        <div>
            <div className='flex flex-row items-center gap-2 smartBulk_parent'>
                <Text variant="headingLg" as="h5">
                    {t("smartBulk.syncMoreCustomers")}
                </Text>
                <div className='smart_badge'>
                    <Badge tone='info' >{t("settings.planName3")}</Badge>
                </div>
            </div>
            <div className='mb-[6px]'></div>
            <div className='max-w-[700px]'>
                <p className="text-[13px]">
                    {t("smartBulk.syncMoreCustomersDesc")}
                </p>
            </div>

            <div className="flex gap-4 mt-4">
                <DateRangePicker
                    disabled={!isProPlanOrHigher}
                    setSelectedDateValues={setSelectedDateValues}
                    t={t}
                />
                <Button variant="primary" size="slim" disabled={!isProPlanOrHigher} onClick={showModal}>
                    {t("smartBulk.syncCustomers")}
                </Button>
            </div>
            <ConfirmationModal
                handlePrimaryClick={handleSyncMoreCustomers}
                handleSecondClick={hideModal}
                primaryButtonText={t("smartBulk.syncCustomers")}
                secondaryButtonText={t("smartBulk.cancelButton")}
                content={t("smartBulk.syncConfirmationMessage")}
                title={t("smartBulk.syncCustomers")}
                id={"confirmation_modal_pull_more_customers"}
            />
        </div>
    )
}
