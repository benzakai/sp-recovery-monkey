import { ActionFunctionArgs } from "@remix-run/node";
import fireStoreCreateService from "~/services/fireStoreCreateService";
import { authenticate } from "~/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
    const data = await request.json();
    const { session } = await authenticate.admin(request);
    try {
        // console.log("datass", data);
        await fireStoreCreateService("settings", session.shop, data, { merge: true });
        console.log("Data successfully saved in 'settings'");
        return ({ message: `Data successfully saved in "settings"`, success: true, data });
    } catch (error) {
        return { error: error, success: false };
    }
}