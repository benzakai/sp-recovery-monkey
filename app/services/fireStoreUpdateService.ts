import { firestore } from "~/utils/firestore.server";

export default async function fireStoreUpdateService<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
) {
  const docRef = firestore.collection(collectionName).doc(docId);

  await docRef.set(
    {
      ...data,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
