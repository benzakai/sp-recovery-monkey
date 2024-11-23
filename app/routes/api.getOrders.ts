import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }: ActionFunctionArgs) {
    const { admin, session, shop } = await authenticate.admin(request);

    const date = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const newDate = new Date(Date.now() - 10 * 60 * 1000);
    const current = new Date(Date.now());

    try {
        const response = await admin.rest.resources.Order.all({
            session: session,
            status: "any",
        });

        return { data: response }

    } catch (error) {
        console.log("ERROR", error);
        return { success: false };
    }
}