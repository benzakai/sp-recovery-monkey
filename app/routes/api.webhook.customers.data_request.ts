import { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
    try {
        const ifHmacExists = request.headers.get('x-shopify-hmac-sha256');

        if (ifHmacExists) {
            return new Response("OK", { status: 200 });
        } else {
            return new Response("Unauthorized", { status: 401 });
        }

    } catch (error) {
        return new Response("Unauthorized", { status: 401 });
    }
}