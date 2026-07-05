const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
  meta: { timestamp: string; requestId?: string };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    const error = new Error(payload.error?.message ?? "Request failed") as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status !== 401 || path === "/auth/refresh" || path === "/auth/me") throw error;
    await request<{ accessToken: string }>("/auth/refresh", { method: "POST" });
    return request<T>(path, init);
  }
}

export { API_URL };
