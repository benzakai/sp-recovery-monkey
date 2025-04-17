import { Firestore } from "@google-cloud/firestore";

const firestoreDatabase = new Firestore();

async function deleteCollectionInBatches(
    collectionRef: FirebaseFirestore.CollectionReference,
    batchSize: number = 500
) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
        return;
    }

    const batch = firestoreDatabase.batch();

    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        // console.log(`Queued delete for: ${doc.ref.path}`);
    });

    await batch.commit();
    // console.log(`Batch deleted ${snapshot.size} documents from ${collectionRef.path}`);

    if (snapshot.size === batchSize) {
        await deleteCollectionInBatches(collectionRef, batchSize);
    }
}

async function firestoreDeleteSubcollections(collectionPath: string, docId: string) {
    try {
        const documentRef = firestoreDatabase.collection(collectionPath).doc(docId);
        const subcollections = await documentRef.listCollections();

        for (const subcollection of subcollections) {
            // console.log(`Deleting subcollection: ${subcollection.path}`);
            await deleteCollectionInBatches(subcollection);
        }

        console.log(`All subcollections under ${collectionPath}/${docId} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting subcollections under ${collectionPath}/${docId}:`, error);
    }
}

export default firestoreDeleteSubcollections;
