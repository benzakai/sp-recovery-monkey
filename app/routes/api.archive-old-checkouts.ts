import { Firestore } from "@google-cloud/firestore";
/**
 * This function archives and deletes documents from the "AbandonedCheckoutsData" collection
 * that arre older than 48 hours. It moves the data to an "ArchivedAbandonedCheckoutsData"
 * collection and deletes the original documents.
 */
export async function loader({ request }: any) {
  console.log("STARTED archiving and deleting AbandonedCheckoutsData older than 48 hours.");

  const firestoreDatabase = new Firestore();
  const FETCH_LIMIT = 100;
  const BATCH_LIMIT = 100;

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 48); // 48 hours ago

  let lastDoc = null;
  let totalArchived = 0;

  try {
    while (true) {
      let query = firestoreDatabase
        .collection("AbandonedCheckoutsData")
        .where("createdAt", "<", twoDaysAgo)
        .orderBy("createdAt")
        .limit(FETCH_LIMIT);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) break;

      const docs = snapshot.docs;
      lastDoc = docs[docs.length - 1];

      for (let i = 0; i < docs.length; i += BATCH_LIMIT) { // this and next line to make sure we don't exceed Firestore's batch limit if by mistake fetch limit is more than batch limit.
        const chunk = docs.slice(i, i + BATCH_LIMIT);
        const batch = firestoreDatabase.batch();

        chunk.forEach((doc) => {
          const data = doc.data();
          const archiveRef = firestoreDatabase.collection("ArchivedAbandonedCheckoutsData").doc(doc.id);
          const sourceRef = firestoreDatabase.collection("AbandonedCheckoutsData").doc(doc.id);

          batch.set(archiveRef, data);
          batch.delete(sourceRef);
        });

        try {
          await batch.commit();
          totalArchived += chunk.length;
          console.log(`archived & deleted ${totalArchived} so far...`);
        } catch (batchError) {
          console.error("error in batch commiit:", batchError);
        }
      }
    }

    console.log(`completed archived and deleted total of ${totalArchived} documents on archive-old-checkouts api.`);
  } catch (outerError) {
    console.error("outside loop failed on archive-old-checkouts api:", outerError);
  }
}