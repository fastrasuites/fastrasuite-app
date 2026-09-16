import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type {
  Scrap,
  CreateScrapRequest,
  UpdateScrapRequest,
  PatchScrapRequest,
  GetScrapsParams,
  ToggleHiddenStatusRequest,
} from "@/types/scrap";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const scrapApi = createApi({
  reducerPath: "scrapApi",
  tagTypes: ["Scrap"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    // Handle both string URLs and object URLs with params
    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      // Build URL with query parameters
      const params = new URLSearchParams();
      if (args.params) {
        Object.entries(args.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      url = `${baseUrl}${args.url}${queryString ? `?${queryString}` : ""}`;
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body:
          typeof args === "string"
            ? undefined
            : args.body
            ? JSON.stringify(args.body)
            : undefined,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          status: "FETCH_ERROR" as const,
          data: error,
        },
      };
    }
  },
  endpoints: (builder) => ({
    // Query endpoints
    getScraps: builder.query<Scrap[], GetScrapsParams>({
      query: (params) => ({
        url: "/inventory/scrap/",
        params,
      }),
      providesTags: ["Scrap"],
    }),

    getScrap: builder.query<Scrap, string>({
      query: (id) => `/inventory/scrap/${id}/`,
      providesTags: (result, error, id) => [{ type: "Scrap", id }],
    }),

    getScrapEditable: builder.query<Scrap, string>({
      query: (id) => `/inventory/scrap/${id}/check_editable/`,
      providesTags: (result, error, id) => [{ type: "Scrap", id }],
    }),

    getActiveScraps: builder.query<Scrap[], void>({
      query: () => "/inventory/scrap/active_list/",
      providesTags: ["Scrap"],
    }),

    getHiddenScraps: builder.query<Scrap[], void>({
      query: () => "/inventory/scrap/hidden_list/",
      providesTags: ["Scrap"],
    }),

    // Mutation endpoints
    createScrap: builder.mutation<Scrap, CreateScrapRequest>({
      query: (body) => ({
        url: "/inventory/scrap/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scrap"],
    }),

    createAndValidateScrap: builder.mutation<Scrap, CreateScrapRequest>({
      query: (body) => ({
        url: "/inventory/scrap/create-and-validate/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scrap"],
    }),

    updateScrap: builder.mutation<
      Scrap,
      { id: string; data: UpdateScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    patchScrap: builder.mutation<
      Scrap,
      { id: string; data: PatchScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    deleteScrap: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/scrap/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scrap"],
    }),

    validateScrap: builder.mutation<
      Scrap,
      { id: string; data?: UpdateScrapRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/validate/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        "Scrap",
        { type: "Scrap", id },
      ],
    }),

    toggleScrapHiddenStatus: builder.mutation<
      Scrap,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data || {},
      }),
    }),

    patchToggleScrapHiddenStatus: builder.mutation<
      Scrap,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/scrap/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetScrapsQuery,
  useGetScrapQuery,
  useGetScrapEditableQuery,
  useGetActiveScrapsQuery,
  useGetHiddenScrapsQuery,

  // Mutation hooks
  useCreateScrapMutation,
  useCreateAndValidateScrapMutation,
  useUpdateScrapMutation,
  usePatchScrapMutation,
  useDeleteScrapMutation,
  useValidateScrapMutation,
  useToggleScrapHiddenStatusMutation,
  usePatchToggleScrapHiddenStatusMutation,
} = scrapApi;
