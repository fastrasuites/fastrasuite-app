import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface ProductCategory {
  id: number;
  url: string;
  category_name: string;
  description: string;
  is_active: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetProductCategoryParams {
  search?: string;
  [key: string]: any;
}

export interface CreateProductCategoryRequest {
  category_name: string;
  description: string;
  is_active?: boolean;
  is_hidden?: boolean;
}

export interface UpdateProductCategoryRequest {
  category_name?: string;
  description?: string;
  is_active?: boolean;
  is_hidden?: boolean;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const productCategoryApi = createApi({
  reducerPath: "productCategoryApi",
  tagTypes: ["ProductCategory"],
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
    getProductCategories: builder.query<
      ProductCategory[],
      GetProductCategoryParams | void
    >({
      query: (params) => ({
        url: "/inventory/product-categories/",
        params: params || {},
      }),
      providesTags: ["ProductCategory"],
    }),
    getProductCategory: builder.query<ProductCategory, number | string>({
      query: (id) => `/inventory/product-categories/${id}/`,
      providesTags: (result, error, id) => [{ type: "ProductCategory", id }],
    }),
    createProductCategory: builder.mutation<
      ProductCategory,
      CreateProductCategoryRequest
    >({
      query: (body) => ({
        url: "/inventory/product-categories/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProductCategory"],
    }),
    updateProductCategory: builder.mutation<
      ProductCategory,
      { id: number | string; data: UpdateProductCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/product-categories/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProductCategory", id },
        "ProductCategory",
      ],
    }),
    patchProductCategory: builder.mutation<
      ProductCategory,
      { id: number | string; data: UpdateProductCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/product-categories/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProductCategory", id },
        "ProductCategory",
      ],
    }),
    deleteProductCategory: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/inventory/product-categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductCategory"],
    }),
    toggleHiddenStatus: builder.mutation<
      ProductCategory,
      { id: number | string; data: UpdateProductCategoryRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/product-categories/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProductCategory", id },
        "ProductCategory",
      ],
    }),
  }),
});

export const {
  useGetProductCategoriesQuery,
  useGetProductCategoryQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  usePatchProductCategoryMutation,
  useDeleteProductCategoryMutation,
  useToggleHiddenStatusMutation,
} = productCategoryApi;
