export type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function parseServiceAccountJson(value: string | undefined): GoogleServiceAccount | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<GoogleServiceAccount>;
    if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") return null;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
      token_uri: typeof parsed.token_uri === "string" ? parsed.token_uri : undefined,
    };
  } catch {
    return null;
  }
}

export function getGoogleSearchConsoleConfig(env: NodeJS.ProcessEnv = process.env) {
  const jsonAccount = parseServiceAccountJson(env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON);
  const splitAccount = env.GSC_CLIENT_EMAIL && env.GSC_PRIVATE_KEY
    ? {
        client_email: env.GSC_CLIENT_EMAIL,
        private_key: env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }
    : null;

  return {
    property: env.GOOGLE_SEARCH_CONSOLE_PROPERTY
      ?? env.GOOGLE_SEARCH_CONSOLE_SITE_URL
      ?? env.GSC_SITE_URL
      ?? null,
    sitemapUrl: env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL ?? null,
    serviceAccount: jsonAccount ?? splitAccount,
  };
}

export function isGoogleSearchConsoleConfigured(env: NodeJS.ProcessEnv = process.env) {
  const config = getGoogleSearchConsoleConfig(env);
  return Boolean(config.property && config.serviceAccount);
}
