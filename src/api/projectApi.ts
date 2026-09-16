import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Project, Budget } from "@/types/project";
import { RootState } from "@/lib/store/store";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}/project-requests${args}`;
    } else {
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
      url = `${baseUrl}/project-requests${endpoint}${queryString ? `?${queryString}` : ""}`;
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body: typeof args === "string" ? undefined : args.body ? JSON.stringify(args.body) : undefined,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json().catch(() => ({ message: response.statusText })),
          },
        };
      }

      const data = await response.json();
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
    getProjects: builder.query<Project[], void>({
      query: () => "/projects/",
    }),
    getProject: builder.query<Project, number>({
      query: (id) => `/projects/${id}/`,
    }),
    getAvailableBudget: builder.query<Budget, { project_id: number; wbs_id: number | string; cost_code: string }>({
      query: (params) => ({
        url: "/budget/available/",
        params,
      }),
    }),
  }),
});

export const { useGetProjectsQuery, useGetProjectQuery, useGetAvailableBudgetQuery } = projectApi;
