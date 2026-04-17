import { API_BASE_URL } from "@/lib/auth/config";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const text = await response.text();

  if (!response.ok) {
    let message = "Something went wrong";
    if (text && isJson) {
      try {
        const data = JSON.parse(text) as unknown;
        if (data && typeof data === "object" && "message" in data) {
          message = String((data as { message: unknown }).message);
        }
      } catch {
      }
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.status === 205 || text.length === 0) {
    return undefined as T;
  }

  if (isJson) {
    return JSON.parse(text) as T;
  }

  return undefined as T;
}
