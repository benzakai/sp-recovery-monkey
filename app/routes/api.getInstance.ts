import { ActionFunctionArgs } from "@remix-run/node";
import { resolveInstanceForConnect } from "~/services/instance/instanceService";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const instance = await resolveInstanceForConnect(session.shop);
    return { instance };
  } catch (error: any) {
    console.error("Error fetching instance data:", error);
    return { error: error.message };
  }
}
