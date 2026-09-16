import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import type {
  IncomingProduct,
  GetIncomingProductsParams,
  CreateIncomingProductRequest,
  UpdateIncomingProductRequest,
  PatchIncomingProductRequest,
} from "../../types/incomingProduct";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const incomingProductApi = createApi({
  reducerPath: "incomingProductApi",
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
    getIncomingProducts: builder.query<
      IncomingProduct[],
      GetIncomingProductsParams
    >({
      query: (params) => ({
        url: "/inventory/incoming-product/",
        params,
      }),
    }),

    getIncomingProduct: builder.query<IncomingProduct, string>({
      query: (id) => `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/`,
    }),

    checkIncomingProductEditable: builder.query<IncomingProduct, string>({
      query: (id) => `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/check_editable/`,
    }),

    getIncomingProductBackorder: builder.query<IncomingProduct, string>({
      query: (id) => `/inventory/incoming-product/${encodeURIComponent(decodeURIComponent(id))}/get_backorder/`,
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
