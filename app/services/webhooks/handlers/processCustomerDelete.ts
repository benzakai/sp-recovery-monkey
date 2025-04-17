import { Firestore } from "@google-cloud/firestore";

const firestoreDatabase = new Firestore();

const processCustomerDelete = async ({ payload, shop }: any) => {
    try {
        const customerQuerySnapshot = await firestoreDatabase
            .collection('storeCustomers')
            .doc(shop)
            .collection('customers')
            .where("idNumber", "==", Number(payload.id))
            .get();

        if (customerQuerySnapshot.empty) {
            // console.log(`No customer found with idNumber: ${payload.id}`);
            return;
        }

        // customerQuerySnapshot.forEach(doc => {
        //     console.log("customer for delete", doc.data())
        // })

        const batch = firestoreDatabase.batch();

        customerQuerySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        // console.log(`Deleted ${customerQuerySnapshot.size} customer(s) for shop ${shop}.`);
    } catch (error) {
        console.log("Error occurred on processCustomerDelete:", error);
    }
};

export default processCustomerDelete;
