import { getPublicBaseUrl } from "@/lib/public-url";

const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/callback/google";

function clean(value: string | undefined) {
  return value?.trim() || "";
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function booleanFlag(value: string | undefined) {
  const normalized = clean(value).toLowerCase();
  return normalized === "1" || normalized === "true";
}

export function expectedGoogleOAuthRedirectUri() {
  return `${normalizeUrl(getPublicBaseUrl())}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export function getGoogleOAuthReadiness() {
  const required = booleanFlag(process.env.YISHUN_GOOGLE_OAUTH_REQUIRED);
  const clientId = clean(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = clean(process.env.GOOGLE_CLIENT_SECRET);
  const configuredRedirect = clean(process.env.GOOGLE_OAUTH_REDIRECT_URI);
  const expectedRedirectUri = expectedGoogleOAuthRedirectUri();
  const redirectUri = configuredRedirect || expectedRedirectUri;
  const hasCredentials = Boolean(clientId && clientSecret);
  const redirectMatches = redirectUri === expectedRedirectUri;

  return {
    required,
    status: hasCredentials && redirectMatches ? "configured" as const : required ? "missing" as const : "not_configured" as const,
    redirectUri,
    expectedRedirectUri,
    redirectMatches,
  };
}
