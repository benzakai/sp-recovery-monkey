import db from '../db.server';
import fireStoreCreateService from "./fireStoreCreateService";
import fireStoreFetchService from "./fireStoreFetchService";

const BATCH_SIZE = 10;

const getActiveSubscription = async (session: any) => {
    const response = await fetch(
        `https://${session.shop}/admin/api/2024-10/graphql.json`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": session.accessToken,
            },
            body: JSON.stringify({
                query: `
                    query ActiveSubscriptions {
                        currentAppInstallation {
                            activeSubscriptions {
                                id
                                name
                                status
                                createdAt
                                currentPeriodEnd
                            }
                        }
                    }
                `
            })
        }
    );

    // 401/402/403/404 means the app was uninstalled or the store is closed, so there is nothing to sync
    if (!response.ok) {
        return { success: false, reason: `HTTP ${response.status}` };
    }

    const responseData = await response.json();
    if (responseData?.errors || !responseData?.data?.currentAppInstallation) {
        return { success: false, reason: "GraphQL error" };
    }

    const subscriptions = responseData.data.currentAppInstallation.activeSubscriptions || [];
    const activeSub = subscriptions.find((sub: any) => sub.status === "ACTIVE") ?? null;
    return { success: true, activeSub };
}

const syncStoreSubscription = async (session: any, dryRun: boolean, dryRunDetails: any[]) => {
    const shop = session.shop;
    try {
        const shopifyResult = await getActiveSubscription(session);
        if (!shopifyResult.success) {
            console.log(`[syncSubscriptions] Skipped ${shop}: ${shopifyResult.reason}`);
            if (dryRun) dryRunDetails.push({ shop, result: "skipped", reason: shopifyResult.reason });
            return "skipped";
        }

        const activeSub = shopifyResult.activeSub;
        const doc = await fireStoreFetchService("subscriptions", shop);

        if (activeSub) {
            if (doc?.plan === activeSub.name && doc?.status === "ACTIVE") return "unchanged";

            if (dryRun) {
                console.log(`[syncSubscriptions] DRY RUN would fix ${shop}: ${doc?.plan}/${doc?.status} -> ${activeSub.name}/ACTIVE`);
                dryRunDetails.push({ shop, result: "wouldFix", from: { plan: doc?.plan ?? null, status: doc?.status ?? null }, to: { plan: activeSub.name, status: "ACTIVE" } });
                return "fixed";
            }

            // merge keeps other fields like proCancelledDate
            await fireStoreCreateService("subscriptions", shop, {
                storeId: shop,
                plan: activeSub.name,
                status: "ACTIVE",
                startDate: activeSub.createdAt,
                endDate: activeSub.currentPeriodEnd ?? "",
                updatedAt: new Date().toISOString(),
            }, { merge: true });
            console.log(`[syncSubscriptions] Fixed ${shop}: ${doc?.plan}/${doc?.status} -> ${activeSub.name}/ACTIVE`);
            return "fixed";
        }

        // no paid plan on Shopify means the store is on Free, same as api.active.subscription.get
        if (doc?.plan === "Free" && doc?.status === "ACTIVE") return "unchanged";

        if (dryRun) {
            console.log(`[syncSubscriptions] DRY RUN would fix ${shop}: ${doc?.plan}/${doc?.status} -> Free/ACTIVE`);
            dryRunDetails.push({ shop, result: "wouldFix", from: { plan: doc?.plan ?? null, status: doc?.status ?? null }, to: { plan: "Free", status: "ACTIVE" } });
            return "fixed";
        }

        await fireStoreCreateService("subscriptions", shop, {
            storeId: shop,
            plan: "Free",
            status: "ACTIVE",
            startDate: new Date().toISOString(),
            endDate: "",
        }, { merge: true });
        console.log(`[syncSubscriptions] Fixed ${shop}: ${doc?.plan}/${doc?.status} -> Free/ACTIVE`);
        return "fixed";
    } catch (error) {
        console.error(`[syncSubscriptions] Error for ${shop}:`, error);
        if (dryRun) dryRunDetails.push({ shop, result: "failed", reason: error instanceof Error ? error.message : String(error) });
        return "failed";
    }
}

// dryRun only logs and returns what would change, nothing is written to Firestore
export default async function syncSubscriptionsWithShopify(dryRun = false) {
    console.log(`Cron started for syncSubscriptionsWithShopify....... dryRun: ${dryRun}`);
    const counts: Record<string, number> = { unchanged: 0, fixed: 0, skipped: 0, failed: 0 };
    const dryRunDetails: any[] = [];

    const sessions = await db.session.findMany({ where: { isOnline: false } });

    // small batches so we don't hit Shopify or Firestore with every store at once
    for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
        const batch = sessions.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map((session) => syncStoreSubscription(session, dryRun, dryRunDetails)));
        results.forEach((result) => counts[result]++);
    }

    console.log(`[syncSubscriptions] Completed for ${sessions.length} stores, dryRun: ${dryRun}`, counts);
    return dryRun ? { ...counts, dryRun, details: dryRunDetails } : { ...counts, dryRun };
}
