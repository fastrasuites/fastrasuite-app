/**
 * Shared RTK Query baseQuery with automatic token refresh.
 *
 * - Tenant APIs use: createTenantBaseQuery()  → https://{schema}.{domain}/...
 * - Auth (login/refresh) stays on NEXT_PUBLIC_API_URL with NO schema
 *   (per backend: token/refresh/ works the same way as login).
 *
 * On 401 + token_not_valid / expired:
 *   1. POST {refresh} to token/refresh/ (single-flight)
 *   2. Update access_token (+ refresh_token) via setAuthData
 *   3. Retry the original request once
 *   4. If refresh fails → clearAuthData + redirect to /auth/login
 */
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import type { RootState } from "@/lib/store/store";
import { setAuthData, clearAuthData } from "@/lib/store/authSlice";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const getApiDomain = () =>
  process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";

const getProtocol = () => {
  const d = getApiDomain();
  return d.includes("localhost") || d.includes("127.0.0.1") ? "http" : "https";
};

/** Public auth host (no tenant schema) — login, refresh, register */
export const getAuthBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return `${getProtocol()}://${getApiDomain()}`;
};

/** Tenant-scoped host — all business APIs */
export const getTenantBaseUrl = (state: RootState): string => {
  const schema = state.auth.tenant_schema_name;
  // Match subscription / public-tenant behaviour
  if (!schema || schema === "public") {
    return getAuthBaseUrl();
  }
  return `${getProtocol()}://${schema}.${getApiDomain()}`;
};

function isTokenError(error: FetchBaseQueryError | undefined): boolean {
  if (!error) return false;
  if (error.status !== 401 && error.status !== 403) return false;

  const data = error.data as any;
  if (!data) return true;

  const blob =
    typeof data === "string" ? data : JSON.stringify(data ?? {}).toLowerCase();

  return (
    blob.includes("token_not_valid") ||
    blob.includes("token is invalid") ||
    blob.includes("token is expired") ||
    blob.includes("given token not valid") ||
    blob.includes("authenticationcredentials") ||
    data?.code === "token_not_valid"
  );
}

function normalizeArgs(args: string | FetchArgs): {
  url: string;
  method: string;
  body?: any;
  params?: Record<string, any>;
  headers?: HeadersInit;
} {
  if (typeof args === "string") {
    return { url: args, method: "GET" };
  }
  return {
    url: args.url,
    method: (args.method || "GET").toUpperCase(),
    body: args.body,
    params: args.params as any,
    headers: args.headers as any,
  };
}

/* -------------------------------------------------------------------------- */
/*                         Single-flight refresh                              */
/* -------------------------------------------------------------------------- */

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(api: {
  getState: () => unknown;
  dispatch: (a: any) => void;
}): Promise<boolean> {
  const state = api.getState() as RootState;
  const refresh = state.auth.refresh_token;

  if (!refresh) return false;

  try {
    const res = await fetch(`${getAuthBaseUrl()}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const access = data.access_token ?? data.access ?? data.accessToken ?? null;
    const newRefresh =
      data.refresh_token ?? data.refresh ?? data.refreshToken ?? refresh;

    if (!access) return false;

    api.dispatch(
      setAuthData({
        access_token: access,
        refresh_token: newRefresh,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

function refreshAccessToken(api: {
  getState: () => unknown;
  dispatch: (a: any) => void;
}): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh(api).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function forceLogout(api: { dispatch: (a: any) => void }) {
  api.dispatch(clearAuthData());
  if (typeof window !== "undefined") {
    const path = window.location.pathname + window.location.search;
    const login = new URL("/auth/login", window.location.origin);
    login.searchParams.set("reason", "token_expired");
    if (path && path !== "/" && !path.startsWith("/auth")) {
      login.searchParams.set("redirect", path);
    }
    window.location.href = login.toString();
  }
}

/* -------------------------------------------------------------------------- */
/*                      Core fetch (tenant or absolute)                       */
/* -------------------------------------------------------------------------- */

type FetchResult = QueryReturnValue<unknown, FetchBaseQueryError, {}>;

async function executeFetch(
  args: string | FetchArgs,
  api: { getState: () => unknown },
  options: { useTenantHost: boolean },
): Promise<FetchResult> {
  const state = api.getState() as RootState;
  const {
    url,
    method,
    body,
    params,
    headers: extraHeaders,
  } = normalizeArgs(args);

  let fullUrl: string;
  if (/^https?:\/\//i.test(url)) {
    fullUrl = url;
  } else {
    const base = options.useTenantHost
      ? getTenantBaseUrl(state)
      : getAuthBaseUrl();
    fullUrl = `${base}${url.startsWith("/") ? url : `/${url}`}`;
  }

  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    if (q) fullUrl += (fullUrl.includes("?") ? "&" : "?") + q;
  }

  const headers = new Headers(extraHeaders || {});
  const token = state.auth.access_token;
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    requestBody = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
    });

    if (response.status === 204) {
      return { data: null };
    }

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      return {
        error: {
          status: response.status,
          data,
        },
      };
    }

    return { data };
  } catch (e) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: String(e),
      },
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                     Public: tenant baseQuery + reauth                      */
/* -------------------------------------------------------------------------- */

export type TenantBaseQueryArgs = string | FetchArgs;

/**
 * Use this as `baseQuery` for every tenant-scoped createApi.
 *
 * @example
 * export const vendorBillsApi = createApi({
 *   reducerPath: "vendorBillsApi",
 *   baseQuery: createTenantBaseQuery(),
 *   endpoints: (builder) => ({ ... }),
 * });
 */
export function createTenantBaseQuery(): BaseQueryFn<
  TenantBaseQueryArgs,
  unknown,
  FetchBaseQueryError
> {
  return async (args, api, _extraOptions) => {
    let result = await executeFetch(args, api, { useTenantHost: true });

    if (result.error && isTokenError(result.error)) {
      const ok = await refreshAccessToken(api);
      if (ok) {
        result = await executeFetch(args, api, { useTenantHost: true });
      } else {
        forceLogout(api);
      }
    }

    return result;
  };
}

/**
 * Optional: baseQuery for public auth host endpoints that still need
 * Bearer + refresh (rare). Prefer authApi's plain fetchBaseQuery for login.
 */
export function createAuthHostBaseQuery(): BaseQueryFn<
  TenantBaseQueryArgs,
  unknown,
  FetchBaseQueryError
> {
  return async (args, api, _extraOptions) => {
    let result = await executeFetch(args, api, { useTenantHost: false });

    if (result.error && isTokenError(result.error)) {
      const ok = await refreshAccessToken(api);
      if (ok) {
        result = await executeFetch(args, api, { useTenantHost: false });
      } else {
        forceLogout(api);
      }
    }

    return result;
  };
}

/** Exported for tests / manual refresh buttons */
export { refreshAccessToken };
