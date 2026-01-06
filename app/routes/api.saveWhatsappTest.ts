import { FieldValue } from "@google-cloud/firestore";
import { ActionFunctionArgs, json } from "@remix-run/node";
import fireStoreCreateService from "~/services/fireStoreCreateService";

const setFirestoreData = async (collectionName: any, documentName: any, data: any) => {
    try {
        await fireStoreCreateService(collectionName, documentName, data, { merge: true });
    } catch (error) {
        // console.error(`Error setting data in ${collectionName}/${documentName}:`, error);
        throw new Error("Failed to set Firestore data");
    }
};

export async function action({ request }: ActionFunctionArgs) {
    const { collectionName, documentName, data, phone, shop, message, page } = await request.json();
    // console.log("data for request body =>>>>>", JSON.stringify({
    //     storeId: shop,
    //     phoneNumber: phone,
    //     ...(page === "smartBulk" ? {
    //         message: {
    //             header: message.header,
    //             content: message.content
    //         }
    //     } : {})
    // }))
    try {
        const webhookURL = page === "smartBulk" ? "https://hook.eu1.make.com/b76m46o362d30xzyh5nxku3xe71j8f3u" : "https://hook.eu1.make.com/qd742i85d5ugdxd6ffw0ftw68l45b66o"
        const response = await fetch(webhookURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                storeId: shop,
                phoneNumber: phone,
                ...(page === "smartBulk" ? {
                    message: {
                        header: message.header,
                        content: message.content
                    }
                } : {})
            })
        })
        if (!response.ok) {
            const text = await response.text();
            const errorText = `Webhook failed with status ${response.status}: ${text}`
            // console.error("errorText=>", errorText);
            return json(
                { error: errorText },
                { status: response.status }
            );
        }
        // const text = await response.text();
        // console.log("worked webhook provided................", text)
        await setFirestoreData(collectionName, documentName, { ...data, lastTestTime: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() });
        return json({ message: `Data successfully saved in ${collectionName}` });
    } catch (error) {
        console.error("Error in sendTestMessage action:", error);
        return json({ error: error?.message }, { status: 500 });
    }
}
