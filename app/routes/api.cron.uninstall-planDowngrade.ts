import { LoaderFunctionArgs } from "@remix-run/node";
import handleUninstallAndPlanDowngrade from "~/services/handleUninstallAndPlanDowngrade";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const data = await handleUninstallAndPlanDowngrade();
        return { success: true };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}