import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    console.log("triggered api.....................")
    try {
        const { admin }: any = await authenticate.public.appProxy(request);
        const data = await request.json()
        console.log("data===", data)
        const { productId } = data
        if (!productId) {
            return json({ message: 'error occurred on disconnectInstance' }, {
                status: 404,

            });
        }
        const response = await admin.graphql(
            `#graphql
                query GetProduct($id: ID!) {
                    product(id: $id) {
                        id
                        title
                        handle
                    }
                }`,
            {
                variables: {
                    "id": `gid://shopify/Product/${Number(productId)}`
                },
            },
        );
        const productData = await response.json();
        if (!productData?.data?.product?.id) {
            return json({ message: "product not found invalid id or something went wrong" }, { status: 401 })
        }
        return json({ success: true, productData: productData.data })
    } catch (error) {
        console.error("error on disconnectInstance:", error);
        return json({ error: error, message: 'error occurred on disconnectInstance' });
    }
};
