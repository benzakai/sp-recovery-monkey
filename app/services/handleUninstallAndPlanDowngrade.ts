import { Firestore } from "@google-cloud/firestore";
import fireStoreDeleteService from "./fireStoreDeleteService";
import firestoreDeleteSubcollections from "./firestoreDeleteSubcollections";

const firestoreDatabase = new Firestore();

const isOlderThan3Months = (compareDate: any): boolean => {
    if (!compareDate) return false;
    const parsedDate = new Date(compareDate);
    if (isNaN(parsedDate.getTime())) return false;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return parsedDate < threeMonthsAgo;
};

export default async function handleUninstallAndPlanDowngrade(): Promise<boolean> {
    console.log("Cron started for handleUninstallAndPlanDowngrade.......");
    try {
        const storeCustomersSnapshot = await firestoreDatabase.collection("storeCustomers").get();
        const subscriptionCollection = firestoreDatabase.collection("subscriptions");
        const permissionsCollection = firestoreDatabase.collection("permissions");
        const appUninstalledDateCollection = firestoreDatabase.collection("AppUninstalledDate");

        const deleteTasks = storeCustomersSnapshot.docs.map(async (doc) => {
            const docId = doc.id;

            // console.log("docId", docId);

            try {
                // to delete 'storeCustomers' data when uninstalled after 3 months
                const appUninstallDoc = await appUninstalledDateCollection.doc(docId).get();
                const uninstallData = appUninstallDoc.data();

                // console.log("uninstallData", uninstallData);
                if (uninstallData) {
                    if (isOlderThan3Months(uninstallData?.appUninstalledDate)) {
                        // console.log("inside if first so deleting storeCustomers");
                        await firestoreDeleteSubcollections("storeCustomers", docId)
                        await fireStoreDeleteService("storeCustomers", docId);
                        return;
                    } else {
                        // console.log(`not eligible for deletion on uninstalled docId: ${docId}`);
                    }
                } else {
                    // console.log("uninstallData not found!");

                }

                // to delete 'storeCustomers' data when plan is less than pro after 3 months
                const subscriptionDoc = await subscriptionCollection.doc(docId).get();
                const subscriptionData = subscriptionDoc.data();
                // console.log("subscriptionData:", subscriptionData, "doc.id", doc.id);

                const permissionsDoc = await permissionsCollection.doc(docId).get();
                const permissionsData = permissionsDoc.data();
                // console.log("permissionsData:", permissionsData, "doc.id", doc.id);

                if (!subscriptionData && !permissionsData) {
                    // console.log(`no data found for docId: ${docId}`);
                    return;
                }

                const plan = subscriptionData?.plan;
                const status = subscriptionData?.status;
                const proCancelledDate = subscriptionData?.proCancelledDate;
                const manualPlan = permissionsData?.manualPlan;

                const isActiveProPlan = (
                    ((plan === "Pro" || plan === "Advance") && status === "ACTIVE") ||
                    manualPlan === "Pro"
                );

                if (!isActiveProPlan) {
                    const dateToCheck = proCancelledDate ?? null;

                    if (isOlderThan3Months(dateToCheck)) {
                        // console.log(`deleting storeCustomers docId: ${docId} , not an active Pro plan`);
                        await firestoreDeleteSubcollections("storeCustomers", docId)
                        await fireStoreDeleteService("storeCustomers", docId);
                    } else {
                        // console.log(`not eligible for deletion on downgrade docId: ${docId}`);
                    }
                } else {
                    // console.log(`active or manually assigned Pro plan, docId: ${docId}`);
                }


            } catch (err) {
                console.error(`error processing storeCustomer ${docId}:`, err);
            }
        });

        await Promise.all(deleteTasks);

        return true;
    } catch (err) {
        console.error("failed to handle uninstalls and plan downgrades:", err);
        return false;
    }
}

