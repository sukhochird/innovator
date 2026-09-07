const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function parseErrorBody(body: unknown): { message: string; fieldErrors?: Record<string, string[]> } {
  if (!body || typeof body !== "object") {
    return { message: "Request failed" };
  }
  const err = body as Record<string, unknown>;
  if (typeof err.detail === "string") {
    return { message: err.detail };
  }
  if (Array.isArray(err.detail)) {
    return { message: err.detail.map(String).join(", ") };
  }
  const fieldErrors: Record<string, string[]> = {};
  const messages: string[] = [];
  for (const [key, value] of Object.entries(err)) {
    if (Array.isArray(value)) {
      fieldErrors[key] = value.map(String);
      messages.push(`${key}: ${value.join(", ")}`);
    } else if (typeof value === "string") {
      messages.push(`${key}: ${value}`);
    }
  }
  if (messages.length > 0) {
    return { message: messages.join("; "), fieldErrors };
  }
  return { message: "Request failed" };
}

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("carq_access"),
    refresh: localStorage.getItem("carq_refresh"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("carq_access", access);
  localStorage.setItem("carq_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("carq_access");
  localStorage.removeItem("carq_refresh");
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  localStorage.setItem("carq_access", data.access);
  return data.access;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  let { access } = getTokens();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && access) {
    access = await refreshAccessToken();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const { message, fieldErrors } = parseErrorBody(err);
    throw new ApiError(message, res.status, fieldErrors);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access: string; refresh: string }>(
    "/api/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  setTokens(data.access, data.refresh);
  return data;
}

export function getWsUrl(path: string): string {
  const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
  const { access } = getTokens();
  const sep = path.includes("?") ? "&" : "?";
  return `${wsBase}${path}${access ? `${sep}token=${access}` : ""}`;
}
