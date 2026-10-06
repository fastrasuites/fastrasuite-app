import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export const deliveryOrderReturnApi = createApi({
  reducerPath: "deliveryOrderReturnApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getDeliveryOrderReturns: builder.query<any[], any>({
      query: (params) => ({
        url: "/inventory/delivery-order-returns/",
        ...(params ? { params } : {}),
      }),
    }),

    getDeliveryOrderReturn: builder.query<any, string>({
      query: (id) => `/inventory/delivery-order-returns/${id}/`,
    }),

    getActiveDeliveryOrderReturns: builder.query<any[], void>({
      query: () => "/inventory/delivery-order-returns/active_list/",
    }),

    getHiddenDeliveryOrderReturns: builder.query<any[], void>({
      query: () => "/inventory/delivery-order-returns/hidden_list/",
    }),

    // Mutation endpoints
    createDeliveryOrderReturn: builder.mutation<any, any>({
      query: (body) => ({
        url: "/inventory/delivery-order-returns/",
        method: "POST",
        body,
      }),
    }),

    updateDeliveryOrderReturn: builder.mutation<any, { id: string; data: any }>(
      {
        query: ({ id, data }) => ({
          url: `/inventory/delivery-order-returns/${id}/`,
          method: "PUT",
          body: data,
        }),
      },
    ),

    patchDeliveryOrderReturn: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/delivery-order-returns/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteDeliveryOrderReturn: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/delivery-order-returns/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),

    toggleDeliveryOrderReturnHiddenStatus: builder.mutation<
      any,
      { id: string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/delivery-order-returns/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetDeliveryOrderReturnsQuery,
  useGetDeliveryOrderReturnQuery,
  useGetActiveDeliveryOrderReturnsQuery,
  useGetHiddenDeliveryOrderReturnsQuery,

  // Mutation hooks
  useCreateDeliveryOrderReturnMutation,
  useUpdateDeliveryOrderReturnMutation,
  usePatchDeliveryOrderReturnMutation,
  useDeleteDeliveryOrderReturnMutation,
  useToggleDeliveryOrderReturnHiddenStatusMutation,
} = deliveryOrderReturnApi;
