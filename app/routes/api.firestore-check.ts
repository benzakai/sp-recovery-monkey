
import { Firestore } from "@google-cloud/firestore";

const firestoreDatabase = new Firestore();



export async function loader() {
    try {
        const docRef = firestoreDatabase.collection('users').doc('alovelace');

        await docRef.set({
            first: 'Ada',
            last: 'Lovelace',
            born: 1815
        });
        console.log('success fire');
        
        return {status:'firesuccess'};
    } catch (error) {
        console.error('Error fetching qr ', error);
        return { error: error.message };
    }
}