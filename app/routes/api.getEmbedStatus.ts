import { getMainThemeId, getSettingsData, isAppEmbedDisabled } from "~/lib/embed_block/common";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: any) => {
    try {
        const { admin, session } = await authenticate.admin(request);
        const app_handle = process.env.APP_HANDLE;
        // console.log('app_handle', app_handle)
        if (!app_handle) {
            return new Response(JSON.stringify({ error: "App handle not found" }), { status: 500 });
        }

        const themeId = await getMainThemeId(admin);
        let embedDisabled = true;

        // console.log("themeId", themeId);

        if (themeId) {
            const settingsData = await getSettingsData(admin, themeId);
            embedDisabled = isAppEmbedDisabled(settingsData, app_handle);
        }

        // console.log("embedDisabled====>", embedDisabled);

        return new Response(JSON.stringify({ embedDisabled }), { status: 200 });
    } catch (error) {
        console.log("error occured on create onboarding", error);
        return new Response(JSON.stringify({ error: error }), { status: 500 });
    }
};