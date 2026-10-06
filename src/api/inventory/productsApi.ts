import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface InventoryProductUnitOfMeasureDetails {
  id?: number;
  url?: string;
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  created_on?: string;
  is_hidden?: boolean;
  [key: string]: any;
}

export interface InventoryProduct {
  url?: string;
  id: number;
  product_code?: string;
  product_name: string;
  description?: string;
  product_category: string;
  unit_of_measure: number;
  unit_of_measure_details?: InventoryProductUnitOfMeasureDetails;
  standard_cost?: string | number;
  reorder_point?: string | number;
  is_active?: boolean;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreateInventoryProductRequest {
  product_name: string;
  description?: string;
  product_category: string;
  unit_of_measure: number;
  standard_cost?: string | number;
  reorder_point?: string | number;
  is_active?: boolean;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
  [key: string]: any;
}

export interface UpdateInventoryProductRequest {
  product_name?: string;
  description?: string;
  product_category?: string;
  unit_of_measure?: number;
  standard_cost?: string | number;
  reorder_point?: string | number;
  is_active?: boolean;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
  [key: string]: any;
}

export interface GetInventoryProductsParams {
  search?: string;
  ordering?: string;
  [key: string]: any;
}

export const inventoryProductsApi = createApi({
  reducerPath: "inventoryProductsApi",
  tagTypes: ["InventoryProducts"],
  baseQuery: createTenantBaseQuery(),

  endpoints: (builder) => ({
    getInventoryProducts: builder.query<
      InventoryProduct[],
      GetInventoryProductsParams
    >({
      query: (params) => ({
        url: "/inventory/products/",
        params,
      }),
      providesTags: ["InventoryProducts"],
    }),
    getActiveInventoryProducts: builder.query<InventoryProduct[], void>({
      query: () => "/inventory/products/active_list/",
      providesTags: ["InventoryProducts"],
    }),
    getHiddenInventoryProducts: builder.query<InventoryProduct[], void>({
      query: () => "/inventory/products/hidden_list/",
      providesTags: ["InventoryProducts"],
    }),
    getInventoryProduct: builder.query<InventoryProduct, number | string>({
      query: (id) => `/inventory/products/${id}/`,
      providesTags: (result, error, id) => [{ type: "InventoryProducts", id }],
    }),
    createInventoryProduct: builder.mutation<
      InventoryProduct,
      CreateInventoryProductRequest
    >({
      query: (body) => ({
        url: "/inventory/products/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
    updateInventoryProduct: builder.mutation<
      InventoryProduct,
      { id: number | string; data: UpdateInventoryProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryProducts", id },
        "InventoryProducts",
      ],
    }),
    patchInventoryProduct: builder.mutation<
      InventoryProduct,
      { id: number | string; data: UpdateInventoryProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryProducts", id },
        "InventoryProducts",
      ],
    }),
    softDeleteInventoryProduct: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/inventory/products/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
    toggleHiddenStatusInventoryProduct: builder.mutation<
      InventoryProduct,
      { id: number | string; data: UpdateInventoryProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryProducts", id },
        "InventoryProducts",
      ],
    }),
    deleteAllInventoryProducts: builder.mutation<void, void>({
      query: () => ({
        url: "/inventory/products/delete-all/",
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
    downloadTemplateInventoryProducts: builder.query<any, void>({
      query: () => "/inventory/products/download-template/",
    }),
    uploadExcelInventoryProducts: builder.mutation<
      any,
      { file: string; check_for_duplicates?: boolean }
    >({
      query: (body) => ({
        url: "/inventory/products/upload_excel/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
  }),
});

export const {
  useGetInventoryProductsQuery,
  useGetActiveInventoryProductsQuery,
  useGetHiddenInventoryProductsQuery,
  useGetInventoryProductQuery,
  useCreateInventoryProductMutation,
  useUpdateInventoryProductMutation,
  usePatchInventoryProductMutation,
  useSoftDeleteInventoryProductMutation,
  useToggleHiddenStatusInventoryProductMutation,
  useDeleteAllInventoryProductsMutation,
  useDownloadTemplateInventoryProductsQuery,
  useUploadExcelInventoryProductsMutation,
} = inventoryProductsApi;
