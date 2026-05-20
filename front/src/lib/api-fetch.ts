import { getApiBaseUrl } from "./api";

export type ApiLoadStatus = "loading" | "success" | "error" | "unconfigured";

export type ApiFetchResult<T> =
  | { status: "success"; data: T }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "unconfigured" };

export async function fetchFromApi<T>(path: string): Promise<ApiFetchResult<T>> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return { status: "unconfigured" };

  const url = path.startsWith("http")
    ? path
    : `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url);
    if (res.status === 404) return { status: "not-found" };
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as T;
    return { status: "success", data };
  } catch {
    return { status: "error" };
  }
}
