import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const { session } = await authenticate.admin(request);
        const body = await request.json();

        console.log("body", body)

        for (const segment of body) {
            const segmentId = segment.id;

            const response = await fetch(
                `https://${session.shop}/admin/api/2026-01/graphql.json`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": session.accessToken,
                    },
                    body: JSON.stringify({
                        query: `
                            mutation {
                                bulkOperationRunQuery(
                                query: """
                                {
                                    customerSegmentMembers(segmentId: "${segmentId}") {
                                    edges {
                                        node {
                                        id
                                        displayName
                                        defaultPhoneNumber {
                                            phoneNumber
                                        }
                                        }
                                    }
                                    }
                                }
                                """
                                ) {
                                bulkOperation {
                                    id
                                    status
                                }
                                userErrors {
                                    field
                                    message
                                }
                                }
                            }
                            `,
                    }),
                }
            );

            const json = await response.json();
            // console.log("Bulk operation response:", JSON.stringify(json.data));
        }

        return jsonResponse({ success: true }, 200);
    } catch (error) {
        console.error("Error running bulk operation:", error);
        return jsonResponse({ success: false }, 500);
    }
};
