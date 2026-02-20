import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();

    const {
      limit = 5,
      after = null,
      before = null,
      search = "",
      direction = "next",
    } = body;

    let paginationArgs = "";

    if (direction === "next") {
      paginationArgs = `first: ${limit}${after ? `, after: "${after}"` : ""}`;
    }

    if (direction === "prev") {
      paginationArgs = `last: ${limit}${before ? `, before: "${before}"` : ""}`;
    }

    const QUERY = `
      query {
        segments(
          ${paginationArgs}
          ${search ? `query: "name:${search}"` : ""}
        ) {
          edges {
            cursor
            node {
              id
              name
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const response = await admin.graphql(QUERY);
    const json = await response.json();

    return jsonResponse({
      success: true,
      segments: json.data.segments.edges.map((e: any) => e.node),
      pageInfo: json.data.segments.pageInfo,
    });
  } catch (error) {
    console.error("Error fetching segments:", error);
    return jsonResponse({ success: false }, 500);
  }
};

