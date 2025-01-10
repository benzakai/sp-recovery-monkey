import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import fireStoreFetchService from "~/services/fireStoreFetchService";

export const loader = async ({ request }: ActionFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);

    try {
        const dashboardData = await fireStoreFetchService("datafordashboard", session.shop)
        // console.log("dashboardData", dashboardData);
        return json({ success: true, dashboardData });
    } catch (error) {
        console.log("Error on welcome-page/cards-data:", error);
        return json({ success: false, error: error, message: 'Error occurred on welcome-page/cards-data' });
    }
};
