import { firestore } from "~/utils/firestore.server";

export default async function fireStoreFetchService(collectionName: string, documentName: string) {

    try {
        const getCollection = firestore.collection(collectionName);
        const doc = await getCollection.doc(documentName).get();
        const getDoc: any = doc.data();

        return getDoc;
    } catch (error) {
        console.log("fireStoreFetchService ERROR", error);
        return { success: false };
    }
}