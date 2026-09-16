import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const productsApi = createApi({
  reducerPath: "productsApi",
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
    getProducts: builder.query<Product[], GetProductsParams>({
      query: (params) => ({
        url: "/purchase/products/",
        params,
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
