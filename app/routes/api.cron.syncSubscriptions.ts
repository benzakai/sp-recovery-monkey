import { LoaderFunctionArgs } from "@remix-run/node";
import syncSubscriptionsWithShopify from "~/services/syncSubscriptionsWithShopify";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
        const counts = await syncSubscriptionsWithShopify(dryRun);
        return { success: true, counts };
    } catch (error) {
        console.log("ERROR on cron.syncSubscriptions", error);
        return { success: false };
    }
}
