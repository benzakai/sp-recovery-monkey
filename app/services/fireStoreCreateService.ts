import { Firestore } from "@google-cloud/firestore";

export default async function fireStoreCreateService(collectionName: string, documentName: string, documentData: any, optionalData: any) {
    const firestoreDatabase = new Firestore();
    try {

        const getCollection = firestoreDatabase.collection(collectionName);
        const data = await getCollection.doc(documentName).set(documentData, optionalData);

        console.log(`Document ${documentName} created for firestore collection ${collectionName}`);

        return { success: true, data };
    } catch (error) {
        console.log("fireStoreCreateService error", error)
        return { success: false };
    }
}