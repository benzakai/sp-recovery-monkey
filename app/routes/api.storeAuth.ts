import { ActionFunctionArgs } from "@remix-run/node";
import prisma from "~/db.server";

const API_SECRET = process.env.INTERNAL_API_SECRET;

function isValidShopDomain(shop: string): boolean {
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    return shopRegex.test(shop);
}

function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const authHeader = request.headers.get("authorization");
        console.log("authHeader", authHeader);

        const token = authHeader?.replace("Bearer ", "").trim();
        if (!token || token !== API_SECRET) {
            return jsonResponse({ success: false, message: "Unauthorized" }, 401);
        }

        const body = await request.json();
        const shop = body?.shop;

        if (!shop || typeof shop !== "string") {
            return jsonResponse({ success: false, message: "Missing 'shop' parameter" }, 400);
        }

        if (shop === "All") {
            const allSessions = await prisma.session.findMany();
            const allData = allSessions.map(session => ({
                shopID: session.shop,
                accessToken: session.accessToken
            }));
            return jsonResponse({ success: true, data: allData }, 200);
        }

        if (!isValidShopDomain(shop)) {
            return jsonResponse({ success: false, message: "Invalid 'shop' parameter" }, 400);
        }

        const data = await prisma.session.findFirst({ where: { shop } });

        if (!data) {
            return jsonResponse({ success: false, message: "No data found for the provided shop" }, 404);
        }

        const dataToSend = {
            shopID: data.shop,
            accessToken: data.accessToken,
        };

        return jsonResponse({ success: true, data: dataToSend }, 200);
    } catch (error) {
        console.error("Error on welcome-page/cards-data:", error);
        return jsonResponse({ success: false, message: "Internal server error" }, 500);
    }
};
