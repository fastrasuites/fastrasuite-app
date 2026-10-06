import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

import type {
  IncomingProduct,
  GetIncomingProductsParams,
  CreateIncomingProductRequest,
  UpdateIncomingProductRequest,
  PatchIncomingProductRequest,
} from "../../types/incomingProduct";

export const incomingProductApi = createApi({
  reducerPath: "incomingProductApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getIncomingProducts: builder.query<
      IncomingProduct[],
      GetIncomingProductsParams
    >({
      query: (params) => ({
        url: "/inventory/incoming-product/",
        ...(params ? { params } : {}),
      }),
    }),

    getIncomingProduct: builder.query<IncomingProduct, string>({
      query: (id) =>
        `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/`,
    }),

    checkIncomingProductEditable: builder.query<IncomingProduct, string>({
      query: (id) =>
        `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/check_editable/`,
    }),

    getIncomingProductBackorder: builder.query<IncomingProduct, string>({
      query: (id) =>
        `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/get_backorder/`,
    }),

    getActiveIncomingProducts: builder.query<IncomingProduct[], void>({
      query: () => "/inventory/incoming-product/active_list/",
    }),

    getHiddenIncomingProducts: builder.query<IncomingProduct[], void>({
      query: () => "/inventory/incoming-product/hidden_list/",
    }),

    // Mutation endpoints
    createIncomingProduct: builder.mutation<
      IncomingProduct,
      CreateIncomingProductRequest
    >({
      query: (body) => ({
        url: "/inventory/incoming-product/",
        method: "POST",
        body,
      }),
    }),

    updateIncomingProduct: builder.mutation<
      IncomingProduct,
      { id: string; data: UpdateIncomingProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/`,
        method: "PUT",
        body: data,
      }),
    }),

    patchIncomingProduct: builder.mutation<
      IncomingProduct,
      { id: string; data: PatchIncomingProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteIncomingProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/soft_delete/`,
        method: "DELETE",
      }),
    }),

    toggleIncomingProductHiddenStatus: builder.mutation<
      IncomingProduct,
      { id: string; data?: PatchIncomingProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/toggle_hidden_status/`,
        method: "PUT",
        body: data || {},
      }),
    }),

    patchToggleIncomingProductHiddenStatus: builder.mutation<
      IncomingProduct,
      { id: string; data?: PatchIncomingProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),

    createIncomingProductBackorder: builder.mutation<
      any,
      { response: boolean; incoming_product: string }
    >({
      query: (body) => ({
        url: "/inventory/create-back-order/",
        method: "POST",
        body,
      }),
    }),

    validateIncomingProductReceipt: builder.mutation<
      IncomingProduct,
      { id: string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/validate_receipt/`,
        method: "POST",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetIncomingProductsQuery,
  useGetIncomingProductQuery,
  useCheckIncomingProductEditableQuery,
  useGetIncomingProductBackorderQuery,
  useGetActiveIncomingProductsQuery,
  useGetHiddenIncomingProductsQuery,

  // Mutation hooks
  useCreateIncomingProductMutation,
  useUpdateIncomingProductMutation,
  usePatchIncomingProductMutation,
  useDeleteIncomingProductMutation,
  useToggleIncomingProductHiddenStatusMutation,
  usePatchToggleIncomingProductHiddenStatusMutation,
  useCreateIncomingProductBackorderMutation,
  useValidateIncomingProductReceiptMutation,
} = incomingProductApi;
