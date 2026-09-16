import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const internalTransferApi = createApi({
  reducerPath: "internalTransferApi",
  tagTypes: ["InternalTransfer"],
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
    getInternalTransfers: builder.query<any[], any>({
      query: (params) => ({
        url: "/inventory/internal-transfer/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "InternalTransfer" as const,
                id,
              })),
              { type: "InternalTransfer", id: "LIST" },
            ]
          : [{ type: "InternalTransfer", id: "LIST" }],
    }),

    getInternalTransfer: builder.query<any, string>({
      query: (id) => `/inventory/internal-transfer/${id}/`,
    }),

    getActiveInternalTransfers: builder.query<any[], void>({
      query: () => "/inventory/internal-transfer/active_list/",
    }),

    getHiddenInternalTransfers: builder.query<any[], void>({
      query: () => "/inventory/internal-transfer/hidden_list/",
    }),

    // Mutation endpoints
    createInternalTransfer: builder.mutation<any, any>({
      query: (body) => ({
        url: "/inventory/internal-transfer/",
        method: "POST",
        body,
      }),
    }),

    updateInternalTransfer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InternalTransfer", id },
      ],
    }),

    patchInternalTransfer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteInternalTransfer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/internal-transfer/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),

    toggleInternalTransferHiddenStatus: builder.mutation<
      any,
      { id: string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetInternalTransfersQuery,
  useGetInternalTransferQuery,
  useGetActiveInternalTransfersQuery,
  useGetHiddenInternalTransfersQuery,

  // Mutation hooks
  useCreateInternalTransferMutation,
  useUpdateInternalTransferMutation,
  usePatchInternalTransferMutation,
  useDeleteInternalTransferMutation,
  useToggleInternalTransferHiddenStatusMutation,
} = internalTransferApi;
