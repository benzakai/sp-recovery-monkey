import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Firestore } from "@google-cloud/firestore";
import fireStoreCreateService from "~/services/fireStoreCreateService";

const firestore = new Firestore();

const setFirestoreData = async (collectionName, documentName, data) => {
    try {
        await fireStoreCreateService(collectionName, documentName, data, { merge: true });
    } catch (error) {
        console.error(`Error setting data in ${collectionName}/${documentName}:`, error);
        throw new Error("Failed to set Firestore data");
    }
};


const getFirestoreData = async (collectionName,storeId) => {
    try {
        const docRef = firestore.collection(collectionName).doc(storeId);
        
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
            
            return docSnapshot.data();
        } else {
            console.log(`No document found with ID ${storeId} in ${collectionName}`);
            return {};
        }
        
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
        
        return json({ data ,storeId});
    } catch (error) {
        return json({});
    }
}


