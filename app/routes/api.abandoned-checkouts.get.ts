import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const formatDateInCustomFormat = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const timezoneOffset = -date.getTimezoneOffset();
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';

    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;

    return formattedDate;
}

export async function loader({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const today = new Date();

    const daysBefore30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = formatDateInCustomFormat(daysBefore30);

    try {
        const response: any = await admin.rest.resources.AbandonedCheckout.checkouts({
            session,
            updated_at_min: last30Days,
        });

        return { success: true, data: response.checkouts }

    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}