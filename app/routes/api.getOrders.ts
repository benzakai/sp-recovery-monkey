import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";



export async function loader({ request }: ActionFunctionArgs) {
    const { admin, session , shop} = await authenticate.admin(request);
   console.log('orde');
   console.log('token',session.accessToken);
   console.log('type tok',typeof session.accessToken)
   console.log('shpopName',session.shop);
   console.log('shop',shop);
   console.log('type sho',typeof session.shop);
   const date = new Date(Date.now() - 10 * 60 * 1000).toISOString();
   const newDate = new Date(Date.now() - 10 * 60 * 1000);
   const current = new Date(Date.now());
   console.log('date',date);
   console.log('new date',newDate);
   console.log('curee',current);
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