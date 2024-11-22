import { Firestore } from "@google-cloud/firestore";

export default async function fireStoreFetchService(collectionName: string, documentName: string) {
    const firestoreDatabase = new Firestore();
    try {

        const getCollection = firestoreDatabase.collection(collectionName);
        const doc = await getCollection.doc(documentName).get();
        const getDoc: any = doc.data();

        return { success: true, data: getDoc };
    } catch (error) {
        console.log("fireStoreFetchService ERROR", error);
        return { success: false };
    }
}