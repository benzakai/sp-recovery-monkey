import { Firestore, Timestamp } from "@google-cloud/firestore";
import currencySymbols from "~/utils/currencySymbols"
const firestoreDatabase = new Firestore()

const processCustomerUpdate = async ({ payload, shop }: any) => {
    try {
        const { total_spent, default_address, addresses } = payload;
        const currencyCode = payload?.currency || 'USD';
        const currencySymbol = currencySymbols[currencyCode] || '$';

        const firstName =
            payload.first_name ||
            default_address?.first_name ||
            addresses.find((d: any) => d?.first_name)?.first_name ||
            '';

        const lastName =
            payload.last_name ||
            default_address?.last_name ||
            addresses.find((d: any) => d?.last_name)?.last_name ||
            '';

        const phone =
            payload.phone ||
            default_address?.phone ||
            addresses.find((d: any) => d?.phone)?.phone ||
            '';

        const customerDataToUpdate = {
            idNumber: Number(payload.id),
            id: payload.admin_graphql_api_id,
            name: `${firstName} ${lastName}`,
            email: payload.email,
            phone,
            numberOfOrders: payload.orders_count,
            amountSpent: parseFloat(total_spent) || 0,
            currencySymbol,
            currencyCode,
            emailMarketingConsentUpdatedAt: payload.email_marketing_consent?.consent_updated_at
                ? Timestamp.fromDate(new Date(payload.email_marketing_consent?.consent_updated_at))
                : null,
            emailMarketingConsentState: typeof payload.email_marketing_consent?.state === 'string'
                ? payload.email_marketing_consent.state.toUpperCase()
                : null,
            createdAt: Timestamp.fromDate(new Date(payload.created_at)),
            updatedAt: Timestamp.fromDate(new Date(payload.updated_at)),
        }
        // console.log("customerDataToUpdate", customerDataToUpdate);

        const customerQuerySnapshot = await firestoreDatabase
            .collection('storeCustomers')
            .doc(shop)
            .collection('customers').where("idNumber", "==", Number(payload.id)).get()


        // console.log("customerQuerySnapshot.empty", customerQuerySnapshot.empty);

        if (customerQuerySnapshot.empty) {
            // console.log(`No customer found with idNumber: ${payload.id}`);
            return;
        }

        // customerQuerySnapshot.forEach(doc => {
        //     console.log("Customer document:", doc.id, doc.data());
        // });

        const batch = firestoreDatabase.batch();

        customerQuerySnapshot.forEach(doc => {
            batch.update(doc.ref, customerDataToUpdate);
        });

        await batch.commit();

        // console.log(`Updated ${customerQuerySnapshot.size} customer(s) for shop ${shop}.`);

        return
    } catch (error) {
        console.log("error occured on processCustomerUpdate", error);

    }
}

export default processCustomerUpdate