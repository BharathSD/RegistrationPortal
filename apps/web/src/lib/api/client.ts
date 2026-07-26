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

type TokenGetter = () => { accessToken: string | null };
type OnTokensRefreshed = (accessToken: string) => void;
type OnAuthExpired = () => void;

let getTokens: TokenGetter = () => ({ accessToken: null });
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
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      // Required for the refresh-token cookie (httpOnly, set by the API) to
      // be sent/received at all — without this, a cross-origin fetch (the
      // web app and API are on different ports in dev, and typically
      // different subdomains in prod) silently drops Set-Cookie/Cookie.
      credentials: "include",
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch {
    // fetch() itself throws (not a rejected-with-status Response) when the
    // server can't be reached at all — dev API not running, no network,
    // DNS failure. Every call site only knows how to handle ApiError (`if
    // (err instanceof ApiError) toast.error(...)`), so without this a dead
    // server means every button in the app silently does nothing on click.
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection and try again.");
  }
}

/** In-flight refresh promise, shared across callers — without this, two requests 401-ing at the same moment would each rotate the refresh token, and the loser's rotation would invalidate the winner's brand-new token. */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    // No body needed — the refresh token travels as the httpOnly cookie,
    // not as a value this code ever sees.
    const res = await rawRequest("/auth/token/refresh", { method: "POST", auth: false });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    onTokensRefreshed(data.accessToken);
    return true;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
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
