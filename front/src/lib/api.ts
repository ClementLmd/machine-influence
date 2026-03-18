export function getApiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

