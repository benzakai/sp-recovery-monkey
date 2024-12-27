import { ActionFunctionArgs } from "@remix-run/node";
import fireStoreFetchService from "~/services/fireStoreFetchService";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import { authenticate } from "~/shopify.server";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";

export async function loader({ request }: ActionFunctionArgs) {
    const { session, admin } = await authenticate.admin(request)
    try {
        // console.log("process.env.API_URL", process.env.API_URL);
        let isInstanceFound = await fireStoreFetchService("InstanceData", session.shop);
        // console.log("isInstanceFound beforeee", isInstanceFound);
        if (isInstanceFound) {
            const responseInstanceState = await fetch(`${isInstanceFound.apiUrl}/waInstance${isInstanceFound.idInstance}/getStateInstance/${isInstanceFound.apiTokenInstance}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (responseInstanceState.ok) {
                const jsonData = await responseInstanceState.json()
                // console.log("responseInstanceState jsonData ==========================>", jsonData);
            } else {
                const textData = await responseInstanceState.text()
                // console.log("responseInstanceState textData ==========================>", textData);
                if (textData.includes("is deleted")) {
                    const deletedDBData = await fireStoreDeleteService("InstanceData", session.shop);
                    // console.log("deletedDBData of instance", deletedDBData);
                    isInstanceFound = null
                }

            }
        }

        if (!isInstanceFound) {
            const responseCreateInstance = await fetch(`${process.env.PARTNER_API_URL}/partner/createInstance/${process.env.PARTNER_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (responseCreateInstance.ok) {
                const responseCreateInstanceData = await responseCreateInstance.json()
                // console.log("responseCreateInstanceData", responseCreateInstanceData);
                isInstanceFound = {
                    shop: session.shop,
                    ...responseCreateInstanceData,
                    apiUrl: process.env.API_URL
                }
                const savedInstanceData = await fireStoreCreateService("InstanceData", session.shop, isInstanceFound, {});
                // console.log("savedInstanceData:", savedInstanceData);
            }
        }
        // console.log("isInstanceFound after", isInstanceFound);
        return { instance: isInstanceFound };
    } catch (error) {
        console.error('Error fetching instance data:', error);
        return { error: error.message };
    }
}