import { LoaderFunctionArgs } from "@remix-run/node";
import storeStatsDataCount from "~/services/storeStatsDataCount";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
    try {

        const storeStatsDataCountData = await storeStatsDataCount()
        return { success: true };
    } catch (error) {
        console.log("ERROR on cron.storeStats.execute", error);
        return { success: false };
    }
}