import { LoaderFunctionArgs } from "@remix-run/node";
import withoutPhoneCheckoutService from "~/services/withoutPhoneCheckoutService";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        await withoutPhoneCheckoutService();
        return { success: true };
    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}