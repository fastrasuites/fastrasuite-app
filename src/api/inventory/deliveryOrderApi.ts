import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import {
  DeliveryOrderConfirmed,
  DeliveryOrderWithAvailability,
} from "@/types/deiveryOrder";

export const deliveryOrderApi = createApi({
  reducerPath: "deliveryOrderApi",
  tagTypes: ["DeliveryOrder"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getDeliveryOrders: builder.query<any[], any>({
      query: (params) => ({
        url: "/inventory/delivery-orders/",
        ...(params ? { params } : {}),
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
