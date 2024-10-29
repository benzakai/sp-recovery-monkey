import { Firestore } from "@google-cloud/firestore";

const firestoreDatabase = new Firestore();

export async function loader({ request }) {
    const docRef = firestoreDatabase.collection('AbandonedChekout');
    const getCollections = await docRef.listDocuments();
    const dataJson = [];

    try {

        const updatedInstances = await Promise.all(
            getCollections.map(async(collection) => {
                const data = await collection.get().then((collection) => collection.data());
                dataJson.push(data);
            }
        ))

        return {dataJson};

    } catch (error) {
        console.log("ERROR", error);
        return false;
    }
}