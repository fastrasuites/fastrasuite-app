import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import {
  DeliveryOrderConfirmed,
  DeliveryOrderWithAvailability,
} from "@/types/deiveryOrder";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const deliveryOrderApi = createApi({
  reducerPath: "deliveryOrderApi",
  tagTypes: ["DeliveryOrder"],
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
    getDeliveryOrders: builder.query<any[], any>({
      query: (params) => ({
        url: "/inventory/delivery-orders/",
        params,
      }),
    }),

    getDeliveryOrder: builder.query<any, string>({
      query: (id) => `/inventory/delivery-orders/${id}/`,
      providesTags: (result, error, id) => [{ type: "DeliveryOrder", id }],
    }),

    getActiveDeliveryOrders: builder.query<any[], void>({
      query: () => "/inventory/delivery-orders/active_list/",
    }),

    getHiddenDeliveryOrders: builder.query<any[], void>({
      query: () => "/inventory/delivery-orders/hidden_list/",
    }),

    //  GET: /inventory/delivery-order/check-availability/{id}/
    checkDeliveryOrderAvailability: builder.mutation<
      DeliveryOrderWithAvailability,
      string
    >({
      query: (id) => ({
        url: `/inventory/delivery-order/check-availability/${id}/`,
        method: "GET",
      }),
      invalidatesTags: (result, error, id) => [{ type: "DeliveryOrder", id }],
    }),

    confirmDeliveryOrder: builder.mutation<DeliveryOrderConfirmed, string>({
      query: (id) => ({
        url: `/inventory/delivery-order/confirm-delivery/${id}/`,
        method: "GET",
      }),
      invalidatesTags: (result, error, id) => [{ type: "DeliveryOrder", id }],
    }),

    // Mutation endpoints
    createDeliveryOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: "/inventory/delivery-orders/",
        method: "POST",
        body,
      }),
    }),

    updateDeliveryOrder: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/delivery-orders/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),

    patchDeliveryOrder: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/delivery-orders/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteDeliveryOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/delivery-orders/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),

    toggleDeliveryOrderHiddenStatus: builder.mutation<
      any,
      { id: string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/delivery-orders/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetDeliveryOrdersQuery,
  useGetDeliveryOrderQuery,
  useGetActiveDeliveryOrdersQuery,
  useGetHiddenDeliveryOrdersQuery,

  // Mutation hooks
  useCheckDeliveryOrderAvailabilityMutation,
  useCreateDeliveryOrderMutation,
  useUpdateDeliveryOrderMutation,
  usePatchDeliveryOrderMutation,
  useDeleteDeliveryOrderMutation,
  useToggleDeliveryOrderHiddenStatusMutation,
  useConfirmDeliveryOrderMutation,
} = deliveryOrderApi;
