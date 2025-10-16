import { Firestore } from "@google-cloud/firestore";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: any) => {
    try {
        const { session } = await authenticate.admin(request);
        const { newGreenApiInstanceStatus } = await request.json()
        // console.log("newGreenApiInstanceStatus", newGreenApiInstanceStatus)

        if (!newGreenApiInstanceStatus) {
            return { success: false, message: "Missing status value" };
        }

        const firestoreDatabase = new Firestore();
        const docRef = firestoreDatabase.collection("settings").doc(session.shop);

        try {
            await docRef.update({ greenApiInstanceStatus: newGreenApiInstanceStatus });
        } catch (error: any) {
            // firestore error code 5 = "not found" document doesn't exist
            if (error.code === 5) {
                await docRef.set(
                    { greenApiInstanceStatus: newGreenApiInstanceStatus },
                    { merge: true }
                );
            } else {
                throw error;
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in action:", error);
        return { success: false, message: error.message || "Unexpected error" };
    }
};