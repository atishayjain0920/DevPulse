/**
 * Centralized API client for the DevPulse Express backend.
 *
 * - Reads base URL from `VITE_API_BASE_URL`.
 * - Sends `credentials: 'include'` so the backend's httpOnly session cookie is
 *   attached to every request (GitHub OAuth session).
 * - Normalizes errors into `ApiError` so React Query error boundaries and UI
 *   error states can render consistent messages.
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /**
   * True when the request never reached the API (DNS failure, offline, CORS,
   * backend down). This MUST NOT be treated as "signed out".
   */
  get isNetworkError() {
    return this.status === 0;
  }
}

export const API_UNREACHABLE_MESSAGE = "Unable to connect to DevPulse API.";

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, QueryValue>;
  body?: unknown;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiFetch<T = unknown>(
  path: string,
  { query, body, headers, method = "GET", ...rest }: RequestOptions = {},
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isFormData
          ? { "Content-Type": "application/json" }
          : {}),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      ...rest,
    });
  } catch (cause) {
    // Transport-level failure: the backend is unreachable. Surfaced as status 0
    // so callers can distinguish it from a 401 (signed out).
    throw new ApiError(API_UNREACHABLE_MESSAGE, 0, cause);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    let message = response.statusText || `Request failed with status ${response.status}`;
    if (payload && typeof payload === "object") {
      if ("error" in payload && payload.error && typeof payload.error === "object" && "message" in (payload.error as any)) {
        message = String((payload.error as any).message);
      } else if ("message" in payload) {
        message = String((payload as any).message);
      }
    }
    throw new ApiError(message, response.status, payload);
  }

  // Unwrap the DevPulse backend envelope: { success: true, data: T }
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as { success: boolean; data?: unknown; error?: unknown };
    if (!envelope.success) {
      const errMsg = (envelope.error && typeof envelope.error === "object" && "message" in (envelope.error as any))
        ? String((envelope.error as any).message)
        : "Operation failed";
      throw new ApiError(errMsg, response.status, payload);
    }
    return envelope.data as T;
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
