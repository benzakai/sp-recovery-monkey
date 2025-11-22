import { Firestore, Timestamp } from "@google-cloud/firestore";
import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

const firestoreDatabase = new Firestore();

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const { session } = await authenticate.admin(request);
        const body = await request.json();
        // console.log("body", body);

        const {
            limit = 10,
            since,
            until,
            cursor,
            prevCursor,
            paginationDirection = "next",
        } = body;

        const storeId = session.shop;
        const checkoutsRef = firestoreDatabase
            .collection("storeCheckouts")
            .doc(session.shop)
            .collection("checkouts");

        let query: FirebaseFirestore.Query = checkoutsRef.orderBy("dateTime", "desc").orderBy("__name__", "desc");

        // DATE FILTERS
        if (since) {
            const sinceDate = new Date(since);
            sinceDate.setHours(0, 0, 0, 0);
            query = query.where("dateTime", ">=", Timestamp.fromDate(sinceDate));
        }
        if (until) {
            const untilDate = new Date(until);
            untilDate.setHours(23, 59, 59, 999);
            query = query.where("dateTime", "<=", Timestamp.fromDate(untilDate));
        }

        const increasedLimit = parseInt(limit) + 1;

        // PAGINATION
        if (paginationDirection === "next") {
            if (cursor) {
                const cursorData = JSON.parse(cursor);
                const cursorTimestamp = Timestamp.fromDate(new Date(cursorData.dateTime));
                query = query.startAfter(cursorTimestamp, cursorData.id);
            }
            query = query.limit(increasedLimit);
        } else if (paginationDirection === "prev") {
            if (prevCursor) {
                const prevCursorData = JSON.parse(prevCursor);
                const prevTimestamp = Timestamp.fromDate(new Date(prevCursorData.dateTime));
                query = query.endBefore(prevTimestamp, prevCursorData.id);
            }
            query = query.limitToLast(increasedLimit);
        } else {
            query = query.limit(increasedLimit);
        }

        const snapshot = await query.get();
        const docs = snapshot.docs;

        let hasNextPage = false;
        let hasPreviousPage = false;

        if (paginationDirection === "next" || !paginationDirection) {
            if (docs.length === increasedLimit) {
                hasNextPage = true;
                docs.pop();
            }
            hasPreviousPage = Boolean(cursor);
        } else if (paginationDirection === "prev") {
            if (docs.length === increasedLimit) {
                hasPreviousPage = true;
                docs.shift();
            }
            hasNextPage = Boolean(prevCursor);
        }

        const checkouts = docs.map((doc) => {
            const data = doc.data();
            return {
                checkoutId: doc.id,
                ...data,
                dateTime: data.dateTime.toDate().toISOString(),
            };
        });

        const firstDoc = docs[0];
        const lastDoc = docs[docs.length - 1];

        const nextCursorOut = lastDoc
            ? JSON.stringify({
                  dateTime: lastDoc.data().dateTime.toDate().toISOString(),
                  id: lastDoc.id,
              })
            : null;
        const prevCursorOut = firstDoc
            ? JSON.stringify({
                  dateTime: firstDoc.data().dateTime.toDate().toISOString(),
                  id: firstDoc.id,
              })
            : null;

        return new Response(
            JSON.stringify({
                success: true,
                checkouts,
                pageInfo: {
                    hasNextPage,
                    hasPreviousPage,
                    nextCursor: nextCursorOut,
                    prevCursor: prevCursorOut,
                },
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("error fetching checkouts:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || "Unknown error" }),
            { status: 500 }
        );
    }
};
