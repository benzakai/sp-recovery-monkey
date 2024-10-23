import { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
    console.log("WEBHOOK: ============>", request);
}