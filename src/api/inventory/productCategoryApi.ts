import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const productCategoryApi = createApi({
  reducerPath: "productCategoryApi",
  tagTypes: ["ProductCategory"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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
