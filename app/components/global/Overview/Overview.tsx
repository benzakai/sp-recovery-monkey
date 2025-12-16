import React, { useEffect } from 'react'
import DashboardOverview from '~/components/WelcomPage/DashboardOverview';

export default function Overview() {
    const [getPageData, setPageData] = React.useState<any>({
        abandonedCarts: [],
        abandonedCartsSum: 0,
        acrRate: null,
        allCarts: [],
        recoveredCarts: [],
        recoveredCartsSum: 0,
        shopCurrency: null,
        success: null
    });

    useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, [])

    async function handleFetchAbandonedCheckouts() {
        try {
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
                setPageData((prev: any) => ({
                    ...prev,
                    acrRate: acr?.toFixed(1),
                    recoveredCarts: Math.trunc(sales_count),
                    recoveredCartsSum: Math.trunc(sum_of_sales),
                    shopCurrency: currency,
                    abandonedCarts: checkout_count,
                    success: true
                }));
            } else {
                setPageData((prev: any) => ({
                    ...prev,
                    acrRate: 0,
                    recoveredCarts: 0,
                    recoveredCartsSum: 0,
                    shopCurrency: "",
                    abandonedCarts: 0,
                    success: true
                }));
            }
        } catch (error) {
            console.error("handleFetchAbandonedCheckouts Error on welcomeConnect", error);
        }
    }

    return (
        <DashboardOverview getPageData={getPageData} forPageType="WelcomeConnect" />
    )
}
