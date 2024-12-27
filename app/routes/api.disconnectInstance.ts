import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreDeleteService from "~/services/fireStoreDeleteService";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const { url, id, token, isDeleteFromDB } = await request.json();
    // console.log("url, id, token, isDeleteFromDB", url, id, token, isDeleteFromDB);

    try {
        const logoutResponse = await fetch(`${url}/waInstance${id}/logout/${token}`)
        if (logoutResponse.ok) {
            const data = await logoutResponse.json()
            // console.log("logoutResponse data", data);
        }
        // if (isDeleteFromDB) {
        //     const deletedDBData = await fireStoreDeleteService("InstanceData", session.shop);
        //     console.log("deletedDBData of instance", deletedDBData);
        // }
        return json({ success: true })

    } catch (error) {
        console.error("error on disconnectInstance:", error);
        return json({ error: error, message: 'error occurred on disconnectInstance' });
    }
};
