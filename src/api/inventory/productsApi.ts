import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const inventoryProductsApi = createApi({
  reducerPath: "inventoryProductsApi",
  tagTypes: ["InventoryProducts"],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
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

      if (response.status === 204) {
        return { data: undefined };
      }

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }
        return {
          error: {
            status: response.status,
            data: errData,
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
    getInventoryProducts: builder.query<InventoryProduct[], GetInventoryProductsParams>({
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
    createInventoryProduct: builder.mutation<InventoryProduct, CreateInventoryProductRequest>({
      query: (body) => ({
        url: "/inventory/products/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
    updateInventoryProduct: builder.mutation<InventoryProduct, { id: number | string; data: UpdateInventoryProductRequest }>({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "InventoryProducts", id }, "InventoryProducts"],
    }),
    patchInventoryProduct: builder.mutation<InventoryProduct, { id: number | string; data: UpdateInventoryProductRequest }>({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "InventoryProducts", id }, "InventoryProducts"],
    }),
    softDeleteInventoryProduct: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/inventory/products/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryProducts"],
    }),
    toggleHiddenStatusInventoryProduct: builder.mutation<InventoryProduct, { id: number | string; data: UpdateInventoryProductRequest }>({
      query: ({ id, data }) => ({
        url: `/inventory/products/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "InventoryProducts", id }, "InventoryProducts"],
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
    uploadExcelInventoryProducts: builder.mutation<any, { file: string; check_for_duplicates?: boolean }>({
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
