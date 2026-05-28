const DEFAULT_PUBLIC_BASE_URL = "https://11263.com";

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

export function getPublicBaseUrl(defaultUrl = DEFAULT_PUBLIC_BASE_URL) {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    defaultUrl
  );
}

export function getRequestBaseUrl(requestOrigin: string) {
  return getPublicBaseUrl(requestOrigin);
}
