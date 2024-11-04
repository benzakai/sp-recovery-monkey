import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

import { Firestore } from "@google-cloud/firestore";
// console.log('Firestore',Firestore);

const firestore = new Firestore();
// console.log('firestore',firestore);
// console.log(process.env.FIRESTORE_CREDENTIALS);


const setFirestoreData = async (collectionName, documentName, data) => {
    try {
        const collection = firestore.collection(collectionName);
        await collection.doc(documentName).set(data, { merge: true });
        console.log(`Data successfully set in ${collectionName}/${documentName}`);
    } catch (error) {
        console.error(`Error setting data in ${collectionName}/${documentName}:`, error);
        throw new Error("Failed to set Firestore data");
    }
};

// Function to get data from Firestore
const getFirestoreData = async (collectionName,storeId) => {
    try {
        const docRef = firestore.collection(collectionName).doc(storeId);
        // const docRef = firestore.collection(collectionName).doc(documentName);
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
            console.log(`Document data for ${storeId}:`, docSnapshot.data());
            return docSnapshot.data();
        } else {
            console.log(`No document found with ID ${storeId} in ${collectionName}`);
            return {};
        }
        
        // const data = snapshot.docs.map((doc) => doc.data());
        // console.log(`Data retrieved from ${collectionName}`);
        
    } catch (error) {
        console.error(`Error retrieving data from ${collectionName}:`, error);
        throw new Error("Failed to retrieve Firestore data");
    }
};

export async function action({ request }: ActionFunctionArgs) {
    const {collectionName, documentName, data} = await request.json();
    try {
        await setFirestoreData(collectionName, documentName, data);
        return json({ message: `Data successfully saved in ${collectionName}` });
    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}


export async function loader({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const collectionName = url.searchParams.get("collectionName");
    const storeId = session.shop;

    if (!collectionName) {
        return json({});
    }
    try {
        const data = await getFirestoreData(collectionName,storeId);
        console.log('getDtaa',data);
        
        return json({ data ,storeId});
    } catch (error) {
        return json({});
    }
}


