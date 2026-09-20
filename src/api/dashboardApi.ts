import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type {
  DashboardCountsResponse,
  DashboardFinancialSummaryResponse,
  DashboardProjectChartResponse,
} from "@/types/dashboard";

const getTenantBaseUrl = (state: RootState): string => {
  let tenantSchemaName = state.auth?.tenant_schema_name;
  if (!tenantSchemaName && typeof window !== "undefined") {
    try {
      tenantSchemaName = localStorage.getItem("tenant_schema_name");
      if (!tenantSchemaName) {
        const persistedAuth = localStorage.getItem("persist:auth");
        if (persistedAuth) {
          const parsed = JSON.parse(persistedAuth);
          tenantSchemaName = parsed.tenant_schema_name
            ? JSON.parse(parsed.tenant_schema_name)
            : null;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";

  return tenantSchemaName
    ? `${protocol}://${tenantSchemaName}.${apiDomain}`
    : `${protocol}://app.${apiDomain}`;
};

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  tagTypes: ["Dashboard"],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);

    let token = state.auth?.access_token;
    if (!token && typeof window !== "undefined") {
      try {
        token = localStorage.getItem("access_token");
        if (!token) {
          const persistedAuth = localStorage.getItem("persist:auth");
          if (persistedAuth) {
            const parsed = JSON.parse(persistedAuth);
            token = parsed.access_token ? JSON.parse(parsed.access_token) : null;
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    let url: string;
    let method = "GET";
    let body: any = undefined;

    if (typeof args === "string") {
      const endpoint = args.startsWith("/") ? args : `/${args}`;
      url = `${baseUrl}${endpoint}`;
    } else {
      method = args.method || "GET";
      const params = new URLSearchParams();
      if (args.params) {
        Object.entries(args.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      const endpoint = args.url.startsWith("/") ? args.url : `/${args.url}`;
      url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ""}`;
      body = args.body ? JSON.stringify(args.body) : undefined;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          errorData = await response.json().catch(() => ({}));
        } else {
          errorData = { message: await response.text().catch(() => "Unknown error") };
        }
        return {
          error: {
            status: response.status,
            data: errorData,
          },
        };
      }

      const data = isJson ? await response.json() : await response.text();
      return { data };
    } catch (error: any) {
      return {
        error: {
          status: "FETCH_ERROR",
          error: error?.message || "Network error",
        },
      };
    }
  },
  endpoints: (builder) => ({
    getDashboardCounts: builder.query<DashboardCountsResponse, void>({
      query: () => "/dashboard/counts/",
      providesTags: ["Dashboard"],
    }),
    getDashboardFinancialSummary: builder.query<
      DashboardFinancialSummaryResponse,
      void
    >({
      query: () => "/dashboard/financial-summary/",
      providesTags: ["Dashboard"],
    }),
    getDashboardProjectChart: builder.query<
      DashboardProjectChartResponse,
      void
    >({
      query: () => "/dashboard/project-chart/",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetDashboardCountsQuery,
  useGetDashboardFinancialSummaryQuery,
  useGetDashboardProjectChartQuery,
} = dashboardApi;
