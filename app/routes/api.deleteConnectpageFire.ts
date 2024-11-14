import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { deleteConnectPageDataFromFirestore } from "~/services/sendDataFromWebhooks";


export async function loader({ request }: ActionFunctionArgs) {
    const { admin, session} = await authenticate.admin(request);
   
    try {
        await deleteConnectPageDataFromFirestore(session.shop);
      
        return json({ success:true})

    } catch (error) {
        console.log("ERROR", error);
        return json({success:false });
    }
}