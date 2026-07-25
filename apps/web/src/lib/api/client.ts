import type { ApiErrorBody } from "@cricket-platform/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenGetter = () => { accessToken: string | null; refreshToken: string | null };
type OnTokensRefreshed = (accessToken: string, refreshToken: string) => void;
type OnAuthExpired = () => void;

let getTokens: TokenGetter = () => ({ accessToken: null, refreshToken: null });
let onTokensRefreshed: OnTokensRefreshed = () => undefined;
let onAuthExpired: OnAuthExpired = () => undefined;

/** Wires the fetch client to the auth store — called once from AuthProvider so this module stays framework-agnostic. */
export function configureApiClient(hooks: {
  getTokens: TokenGetter;
  onTokensRefreshed: OnTokensRefreshed;
  onAuthExpired: OnAuthExpired;
}) {
  getTokens = hooks.getTokens;
  onTokensRefreshed = hooks.onTokensRefreshed;
  onAuthExpired = hooks.onAuthExpired;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // attach bearer token (default true)
  isFormData?: boolean;
}

async function rawRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", body, auth = true, isFormData = false } = options;
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const { accessToken } = getTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;
  const res = await rawRequest("/auth/token/refresh", { method: "POST", body: { refreshToken }, auth: false });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  onTokensRefreshed(data.accessToken, data.refreshToken);
  return true;
}

/** Every API call in the app funnels through here: attaches the bearer token, retries once on 401 via refresh rotation, and normalizes errors into ApiError. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && options.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawRequest(path, options);
    } else {
      onAuthExpired();
    }
  }

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(
      res.status,
      body?.error.code ?? "UNKNOWN_ERROR",
      body?.error.message ?? res.statusText,
      body?.error.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
