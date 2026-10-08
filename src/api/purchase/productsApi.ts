import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

// Define types for requests and responses
export interface UnitOfMeasureDetails {
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface Product {
  url: string;
  id: number;
  product_name: string;
  product_description: string;
  product_category: "consumable" | string;
  available_product_quantity: string;
  total_quantity_purchased: string;
  unit_of_measure: number;
  created_on: string;
  updated_on: string;
  is_hidden: boolean;
  unit_of_measure_details: UnitOfMeasureDetails;
}

export interface GetProductsParams {
  search?: string;
  unit_of_measure__unit_name?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateProductRequest {
  product_name: string;
  product_description: string;
  product_category: "consumable" | string;
  unit_of_measure: number;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
}

export interface UpdateProductRequest {
  product_name: string;
  product_description: string;
  product_category: "consumable" | string;
  unit_of_measure: number;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
}

export interface PatchProductRequest {
  product_name?: string;
  product_description?: string;
  product_category?: "consumable" | string;
  unit_of_measure?: number;
  is_hidden?: boolean;
  check_for_duplicates?: boolean;
}

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getProducts: builder.query<Product[], GetProductsParams>({
      query: (params) => ({
        url: "/purchase/products/",
        ...(params ? { params } : {}),
      }),
    }),
    getProduct: builder.query<Product, number>({
      query: (id) => `/purchase/products/${id}/`,
    }),

    // Mutation endpoints
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: "/purchase/products/",
        method: "POST",
        body,
      }),
    }),
    updateProduct: builder.mutation<
      Product,
      { id: number; data: UpdateProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/products/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchProduct: builder.mutation<
      Product,
      { id: number; data: PatchProductRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/products/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/products/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  usePatchProductMutation,
  useDeleteProductMutation,
} = productsApi;
