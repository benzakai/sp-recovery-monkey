import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getAppInstalledDate, getSubscriptionsData } from "~/services/sendDataFromWebhooks";

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

function convertFirestoreTimestampToISO(timestamp) {
  const milliseconds = timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000;
  const date = new Date(milliseconds);

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

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

export async function loader({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const today = new Date();
  const daysBefore30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = formatDateInCustomFormat(daysBefore30);

  let allCheckouts = [];
  let lastId = null;

  try {

    do {
      const response = await admin.rest.resources.AbandonedCheckout.checkouts({
        session,
        limit: "250",
        ...(lastId && { since_id: lastId })
      });

      const checkouts = response.checkouts;
      allCheckouts = [...allCheckouts, ...checkouts];

      if (checkouts.length > 0) {

        lastId = checkouts[checkouts.length - 1].id;
      } else {
        break;
      }
    } while (allCheckouts.length % 250 === 0);

    const appInstalledDate = await getAppInstalledDate(session);

    const getAbandonedCartsSinceAppInstall = allCheckouts.filter((item: any) => new Date(item.created_at).getTime() >= new Date(appInstalledDate?.appInstalledDate?.toDate()).getTime());
    const getAbandonedCartsCount = getAbandonedCartsSinceAppInstall.filter((item: any) => item.completed_at == null).length;
    const getAbandonedCartsRecoveredCount = getAbandonedCartsSinceAppInstall.filter((item: any) => item.completed_at != null).length;

    const calculateACRRate = ((getAbandonedCartsRecoveredCount / getAbandonedCartsCount) * 100).toFixed(2);

    return json({ success: true, data: allCheckouts, acrRate: calculateACRRate });

  } catch (error) {
    console.log("ERROR", error);
    return json({ success: false });
  }
}