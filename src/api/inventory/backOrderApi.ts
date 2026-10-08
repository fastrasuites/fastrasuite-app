import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import type {
  BackOrder,
  GetBackOrdersParams,
  CreateBackOrderRequest,
} from "../../types/backOrder";

// Helper function to get tenant-specific base URL

export const backOrderApi = createApi({
  reducerPath: "backOrderApi",

  tagTypes: ["BackOrder"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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

    updateBackOrder: builder.mutation<
      BackOrder,
      { id: string; data: Partial<BackOrder> }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/back-order/${id}/?form=true`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "BackOrder", id },
        "BackOrder",
      ],
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
      invalidatesTags: (result, error, id) => [
        { type: "BackOrder", id },
        "BackOrder",
      ],
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
