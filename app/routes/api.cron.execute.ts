import { LoaderFunctionArgs } from "@remix-run/node";
import { sendDataFromWebhooks } from "~/services/sendDataFromWebhooks";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        await sendDataFromWebhooks();
        return { success: true };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}