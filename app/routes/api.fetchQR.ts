import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getProviderConfig } from "~/services/instance/providerConfig";
import { resolveInstanceForConnect } from "~/services/instance/instanceService";

export async function action({ request }: ActionFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const storeId = session.shop;
    // console.log("storeid from fetchQR", storeId);
    try {
        // Resolve server-side on every poll so stale browser credentials cannot
        // display another Green-API QR after the old connection is disconnected.
        const instance = await resolveInstanceForConnect(storeId);
        if (instance.provider !== "greener") {
            // A legacy instance is only returned while it's authorized or still settling
            // (e.g. "starting"); the page keeps polling on any type other than qrCode/alreadyLogged.
            if (instance.stateInstance !== "authorized") {
                return { qrData: { type: "waiting", stateInstance: instance.stateInstance }, storeId, instance };
            }
            return { qrData: { type: "alreadyLogged" }, storeId, instance };
        }

        const { qrMethod } = getProviderConfig("greener");
        const requestUrl = `${instance.apiUrl}/waInstance${instance.idInstance}/${qrMethod}/${instance.apiTokenInstance}`;
        const response = await fetch(requestUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Greener QR (HTTP ${response.status})`);
        }
        const qrData = await response.json();
        // console.log("qrData.....", qrData)
        return { qrData, storeId, instance };
    } catch (error) {
        // console.log("error occured while fetchQR", error)
        return json({ error: error instanceof Error ? error.message : "Failed to load WhatsApp connection" }, { status: 503 });
    }
}
