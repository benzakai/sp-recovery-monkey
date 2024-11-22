import { Firestore } from "@google-cloud/firestore";

export default async function fireStoreDeleteService(collectionName: string, documentName: string) {
    const firestoreDatabase = new Firestore();
    try {
        const getCollection = firestoreDatabase.collection(collectionName);
        await getCollection.doc(documentName).delete();
        return { success: true };
    } catch (error) {
        console.log("fireStoreDeleteService error", error);
        return { success: false };
    }
}