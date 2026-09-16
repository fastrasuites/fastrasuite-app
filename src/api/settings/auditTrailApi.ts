import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import { AuditTrail, AuditTrailParams } from "@/types/auditTrail";

// Helper to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const auditTrailApi = createApi({
  reducerPath: "auditTrailApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["AuditTrails"],
  endpoints: (builder) => ({
    getAuditTrails: builder.query<AuditTrail[], AuditTrailParams | void>({
      queryFn: async (params, { getState }, _extraOptions, baseQuery) => {
        const state = getState() as RootState;
        const baseUrl = getTenantBaseUrl(state);

        let queryString = "";
        if (params) {
          const queryParams = new URLSearchParams();
          if (params.ordering) queryParams.set("ordering", params.ordering);
          if (params.search) queryParams.set("search", params.search);
          if (params.module) queryParams.set("module", params.module);
          if (params.action) queryParams.set("action", params.action);
          if (params.page) queryParams.set("page", params.page.toString());
          if (params.page_size)
            queryParams.set("page_size", params.page_size.toString());
          const qs = queryParams.toString();
          if (qs) {
            queryString = `?${qs}`;
          }
        }

        const result = await baseQuery({
          url: `${baseUrl}/audit-trails/${queryString}`,
          method: "GET",
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as any;
        // Support both array response and paginated { results: [...] } response
        const list = Array.isArray(data) ? data : data?.results || [];
        return { data: list as AuditTrail[] };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "AuditTrails" as const, id })),
              { type: "AuditTrails", id: "LIST" },
            ]
          : [{ type: "AuditTrails", id: "LIST" }],
    }),
    getAuditTrailById: builder.query<AuditTrail, string | number>({
      queryFn: async (id, { getState }, _extraOptions, baseQuery) => {
        const state = getState() as RootState;
        const baseUrl = getTenantBaseUrl(state);

        const result = await baseQuery({
          url: `${baseUrl}/audit-trails/${id}/`,
          method: "GET",
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as AuditTrail };
      },
      providesTags: (result, error, id) => [{ type: "AuditTrails", id }],
    }),
  }),
});

export const { useGetAuditTrailsQuery, useGetAuditTrailByIdQuery } =
  auditTrailApi;
