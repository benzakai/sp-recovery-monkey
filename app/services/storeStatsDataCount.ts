import { Firestore } from "@google-cloud/firestore";
import db from '../db.server';

const firestoreDatabase = new Firestore();

const getOrdersCount = async (session: any) => {
    try {
        if (session) {
            // getting yesterday's date for startOfDay and endOfDay
            const startOfDay = new Date();
            startOfDay.setDate(startOfDay.getDate() - 1); // moving to yesterday
            startOfDay.setUTCHours(0, 0, 0, 0); // setting to start of the day
            const endOfDay = new Date(startOfDay); // copings startOfDay to endOfDay
            endOfDay.setUTCHours(23, 59, 59, 999); // setting to end of the day
            const startOfDayISO = startOfDay.toISOString();
            const endOfDayISO = endOfDay.toISOString();
            // console.log("startOfDayISO", startOfDayISO);
            // console.log("endOfDayISO", endOfDayISO);
            const responseOrdersCount = await fetch(
                `https://${session.shop}/admin/api/2024-10/graphql.json`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": session.accessToken,
                    },
                    body: JSON.stringify({
                        query: `
                            query OrdersCount {
                                ordersCount(query: "created_at:>=${startOfDayISO} AND created_at:<=${endOfDayISO}") {
                                    count
                                    precision
                                }
                            }
                        `
                    })
                }
            );
            const responseOrdersCountData = await responseOrdersCount.json();
            // console.log("responseOrdersCountData ===>", responseOrdersCountData);
            return { ordersCount: responseOrdersCountData?.data?.ordersCount?.count || 0, success: responseOrdersCountData?.data?.ordersCount ? true : false }
        }
    } catch (error) {
        console.error("Error occurred in getOrdersCount:", error);
    }
    return null;
}

const getTodaysCheckoutsCount = async (session: any) => {
    try {
        let todaysCheckoutsCount = 0;
        // getting yesterday'sd date for startOfDay
        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() - 1); // moving to yesterday
        startOfDay.setUTCHours(0, 0, 0, 0); // setting to start of the daya
        // console.log("startOfDay on getTodaysCheckoutsCount", startOfDay);
        const docRef = await firestoreDatabase.collection("checkout").doc(session.shop).get();
        const checkoutDoc = docRef.data();
        // console.log("checkoutDoc", checkoutDoc);
        if (checkoutDoc && typeof checkoutDoc === 'object' && Object.keys(checkoutDoc).length > 0) {
            for (const [key, value] of Object.entries(checkoutDoc)) {
                try {
                    const parsedValue = JSON.parse(value);
                    // console.log("parsedData", parsedValue);
                    const dateTimeStr = parsedValue.DateTime;
                    const [day, month, yearAndTime] = dateTimeStr.split('/');
                    const [year, time] = yearAndTime.split(' ');
                    const [hour, minute, second] = time.split(':');
                    const formattedDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                    // console.log("formattedDateTime", formattedDateTime);
                    const checkoutDate = new Date(formattedDateTime);
                    // console.log("checkoutDate", checkoutDate);
                    // checking if checkoutDate is from yesterday
                    if (!isNaN(checkoutDate.getTime()) && checkoutDate >= startOfDay) {
                        todaysCheckoutsCount++;
                    }
                } catch (error) {
                    console.error("Error parsing value for key", key, ":", error);
                }
            }
        }
        // console.log("checkouts count ===>", todaysCheckoutsCount);
        return todaysCheckoutsCount;
    } catch (error) {
        console.error("Error occurred in getCheckoutsCount:", error);
    }
    return null;
}

export default async function storeStatsDataCount() {
    try {
        console.log("..................storeStatsDataCount function started processing data.....................");
        const sessions = await db.session.findMany(); // finding all the store session to check storeStats
        for (const session of sessions) {
            const ordersCountData = await getOrdersCount(session);
            // console.log("ordersCountDat===>", ordersCountData);
            if (!ordersCountData?.success) {
                console.log(`It seems accessToken is expired for "${session.shop}" store on storeStatsDataCount cron`)
            }
            const todaysCheckoutsCountData = await getTodaysCheckoutsCount(session);
            console.log(`Session ${session.shop}: Orders Count - ${ordersCountData?.ordersCount}, Checkouts Count - ${todaysCheckoutsCountData}`);
            const shopDocRef = firestoreDatabase.collection('storeStats').doc(session.shop);
            const shopDoc = await shopDocRef.get();
            // formattingd the date for a count object key (yesterday's date)
            const startOfDay = new Date();
            startOfDay.setDate(startOfDay.getDate() - 1); // moving to yesterday
            const day = String(startOfDay.getUTCDate()).padStart(2, '0');
            const month = String(startOfDay.getUTCMonth() + 1).padStart(2, '0');
            const year = startOfDay.getUTCFullYear();
            const formattedDate = `${day}-${month}-${year}`;
            // console.log("formattedDate", formattedDate);

            const storeStatsCount = {
                ordersCount: ordersCountData?.ordersCount,
                checkoutsCount: todaysCheckoutsCountData
            }
            // console.log("Formatted Date:", formattedDate);
            // console.log("storeStats data to save.", {
            //     [formattedDate]: storeStatsCount
            // });
            if (shopDoc.exists) {
                await shopDocRef.update({
                    [formattedDate]: storeStatsCount,
                });
            } else {
                await shopDocRef.set({
                    [formattedDate]: storeStatsCount,
                }, { merge: true });
            }

        };
        console.log("..................storeStatsDataCount function processing end.....................");
        return { status: true };
    } catch (error) {
        console.error("error in storeStatsDataCount:", error);
        return { status: false, error: error };
    }
}
