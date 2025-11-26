
const GET_THEMES = `
  query {
    themes(first: 20) {
      edges {
        node {
          id
          role
          name
        }
      }
    }
  }
`;

const GET_THEME_FILE = `
  query getThemeFile($id: ID!) {
    theme(id: $id) {
      files(filenames: ["config/settings_data.json"], first: 1) {
        nodes {
          filename
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
            }
          }
        }
      }
    }
  }
`;

export async function getMainThemeId(
  admin: any
): Promise<string | undefined> {
  const response = await admin.graphql(GET_THEMES);
  const responseJson = await response.json();

  const themes = responseJson?.data?.themes?.edges ?? [];
  const mainTheme = themes.find((t: any) => t.node.role === "MAIN");

  return mainTheme ? mainTheme.node.id : undefined;
}

export async function getSettingsData(admin: any, themeId: string) {
  const response = await admin.graphql(GET_THEME_FILE, { variables: { id: themeId } });
  const result = await response.json();

  const rawContent = result?.data?.theme?.files?.nodes?.[0]?.body?.content ?? "";

  const cleaned = rawContent.replace(/\/\*[\s\S]*?\*\//, "");

  return JSON.parse(cleaned);
}

export function isAppEmbedDisabled(parsedData: any, appHandle: string): boolean {
  const blocks = parsedData?.current?.blocks;
  console.log("blocks", blocks)
  if (!blocks) {
    return true;
  }

  const appKey = appHandle.toLowerCase();
  for (const blockId of Object.keys(blocks)) {
    const block = blocks[blockId];
    console.log('value of block', block)
    console.log('appKey', appKey)
    if (block?.type?.toLowerCase().includes(appKey)) {
      console.log("block------------------->", block)
      return block.disabled;
    }
  }

  return true;
}
