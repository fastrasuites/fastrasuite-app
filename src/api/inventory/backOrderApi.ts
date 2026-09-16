import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import type { 
  BackOrder, 
  GetBackOrdersParams,
  CreateBackOrderRequest
} from "../../types/backOrder";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const backOrderApi = createApi({
  reducerPath: "backOrderApi",
  tagTypes: ["BackOrder"],
  baseQuery: async (args, api) => {
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
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            status: response.status,
            data: errorData,
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
    getBackOrders: builder.query<BackOrder[], GetBackOrdersParams>({
      query: (params) => ({
        url: "/inventory/back-order/",
        params: { ...params, form: "true" },
      }),
      providesTags: ["BackOrder"],
    }),

    getBackOrder: builder.query<BackOrder, string>({
      query: (id) => `/inventory/back-order/${id}/?form=true`,
      providesTags: (result, error, id) => [{ type: "BackOrder", id }],
    }),

    createBackOrder: builder.mutation<BackOrder, CreateBackOrderRequest>({
      query: (body) => ({
        url: "/inventory/back-order/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BackOrder"],
    }),

    updateBackOrder: builder.mutation<BackOrder, { id: string; data: Partial<BackOrder> }>({
      query: ({ id, data }) => ({
        url: `/inventory/back-order/${id}/?form=true`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "BackOrder", id }, "BackOrder"],
    }),

    softDeleteBackOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/back-order/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["BackOrder"],
    }),

    toggleBackOrderHiddenStatus: builder.mutation<BackOrder, string>({
      query: (id) => ({
        url: `/inventory/back-order/${id}/toggle_hidden_status/`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [{ type: "BackOrder", id }, "BackOrder"],
    }),
  }),
});

export const {
  useGetBackOrdersQuery,
  useGetBackOrderQuery,
  useCreateBackOrderMutation,
  useUpdateBackOrderMutation,
  useSoftDeleteBackOrderMutation,
  useToggleBackOrderHiddenStatusMutation,
} = backOrderApi;
