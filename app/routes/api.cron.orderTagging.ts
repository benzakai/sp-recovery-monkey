import { LoaderFunctionArgs } from "@remix-run/node";
import orderTaggingService from "~/services/orderTaggingService";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        await orderTaggingService();
        return { success: true };
    } catch (error) {
        console.log("ERROR on orderTaggingService cron", error);
        return { success: false };
    }
}