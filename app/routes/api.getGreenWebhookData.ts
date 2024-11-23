import { ActionFunctionArgs } from "@remix-run/node";

let data;

export async function action({ request }: ActionFunctionArgs) {
    data = await request.json();
    try {
        return { data };
    } catch (error) {
        return { error: error.message };
    }
}

export async function loader({ request }: ActionFunctionArgs) {
    try {
        return { data };
    } catch (error) {
        return { error: error.message };
    }
}
