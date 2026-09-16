import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

// Define types for nested objects
export interface User {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface UserDetails {
  url: string;
  id: number;
  user: User;
  role: string;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  groups: string[];
}

export interface CurrencyDetails {
  url: string;
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  created_on: string;
  is_hidden: boolean;
}

export interface VendorDetails {
  url: string;
  id: number;
  company_name: string;
  profile_picture: string;
  email: string;
  address: string;
  phone_number: string;
  is_hidden: boolean;
}

export interface UnitOfMeasureDetails {
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface ProductDetails {
  url: string;
  id: number;
  product_name: string;
  product_description: string;
  product_category: string;
  available_product_quantity: string;
  total_quantity_purchased: string;
  unit_of_measure: number;
  created_on: string;
  updated_on: string;
  is_hidden: boolean;
  unit_of_measure_details: UnitOfMeasureDetails;
}

// Define main types
export interface RfqItem {
  id: number;
  url: string;
  request_for_quotation: string;
  product: number;
  product_details: ProductDetails;
  qty: number;
  estimated_unit_price: string;
  total_price: string;
}

export interface RequestForQuotation {
  url: string;
  id: string;
  expiry_date: string;
  vendor: number;
  purchase_request: string;
  currency: number;
  status: "draft" | "approved" | "pending" | "rejected";
  items: RfqItem[];
  is_hidden: boolean;
  is_expired: string;
  is_submitted: boolean;
  can_edit: boolean;
  vendor_details: VendorDetails;
  currency_details: CurrencyDetails;
  date_created: string;
  date_updated: string;
  rfq_total_price: string;
}

// Define query parameter types
export interface GetRequestForQuotationsParams {
  date_created?: string;
  purchase_request__id?: string;
  search?: string;
  status?: "approved" | "draft" | "pending" | "rejected";
  [key: string]: string | number | boolean | undefined;
}

export interface GetRfqItemsParams {
  request_for_quotation__id?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Define request body types
export interface CreateRfqItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface UpdateRfqItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface PatchRfqItemRequest {
  product?: number;
  qty?: number;
  estimated_unit_price?: string;
}

export interface CreateRequestForQuotationRequest {
  expiry_date: string;
  vendor: number;
  purchase_request: string;
  currency: number;
  status?: "draft" | "approved" | "pending" | "rejected";
  items: CreateRfqItemRequest[];
  is_hidden?: boolean;
  is_submitted?: boolean;
  can_edit?: boolean;
}

export interface UpdateRequestForQuotationRequest {
  expiry_date?: string;
  vendor?: number;
  purchase_request?: string;
  currency?: number;
  status?: "draft" | "approved" | "pending" | "rejected";
  items?: UpdateRfqItemRequest[];
  is_hidden?: boolean;
  is_submitted?: boolean;
  can_edit?: boolean;
}

export interface PatchRequestForQuotationRequest {
  expiry_date?: string;
  vendor?: number;
  purchase_request?: string;
  currency?: number;
  status?: "draft" | "approved" | "pending" | "rejected";
  items?: PatchRfqItemRequest[];
  is_hidden?: boolean;
  is_submitted?: boolean;
  can_edit?: boolean;
}

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const requestForQuotationApi = createApi({
  reducerPath: "requestForQuotationApi",
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
    // Request For Quotation Query endpoints
    getRequestForQuotations: builder.query<
      RequestForQuotation[],
      GetRequestForQuotationsParams
    >({
      query: (params) => ({
        url: "/purchase/request-for-quotation/",
        params,
      }),
    }),
    getRequestForQuotation: builder.query<RequestForQuotation, string>({
      query: (id) => `/purchase/request-for-quotation/${id}/`,
    }),
    // Get approved RFQs for purchase order creation
    getApprovedRfqList: builder.query<RequestForQuotation[], void>({
      query: () => "/purchase/request-for-quotation/approved_list/",
    }),

    // Request For Quotation Mutation endpoints
    createRequestForQuotation: builder.mutation<
      RequestForQuotation,
      CreateRequestForQuotationRequest
    >({
      query: (body) => ({
        url: "/purchase/request-for-quotation/",
        method: "POST",
        body,
      }),
    }),
    updateRequestForQuotation: builder.mutation<
      RequestForQuotation,
      { id: string; data: UpdateRequestForQuotationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/request-for-quotation/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchRequestForQuotation: builder.mutation<
      RequestForQuotation,
      { id: string; data: PatchRequestForQuotationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/request-for-quotation/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    // RFQ Item Query endpoints
    getRfqItems: builder.query<RfqItem[], GetRfqItemsParams>({
      query: (params) => ({
        url: "/purchase/request-for-quotation-items/",
        params,
      }),
    }),
    getRfqItem: builder.query<RfqItem, number>({
      query: (id) => `/purchase/request-for-quotation-items/${id}/`,
    }),

    // RFQ Item Mutation endpoints
    createRfqItem: builder.mutation<RfqItem, CreateRfqItemRequest>({
      query: (body) => ({
        url: "/purchase/request-for-quotation-items/",
        method: "POST",
        body,
      }),
    }),
    updateRfqItem: builder.mutation<
      RfqItem,
      { id: number; data: UpdateRfqItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/request-for-quotation-items/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchRfqItem: builder.mutation<
      RfqItem,
      { id: number; data: PatchRfqItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/request-for-quotation-items/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteRfqItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/request-for-quotation-items/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  // Request For Quotation hooks
  useGetRequestForQuotationsQuery,
  useGetRequestForQuotationQuery,
  useGetApprovedRfqListQuery,
  useCreateRequestForQuotationMutation,
  useUpdateRequestForQuotationMutation,
  usePatchRequestForQuotationMutation,

  // RFQ Item hooks
  useGetRfqItemsQuery,
  useGetRfqItemQuery,
  useCreateRfqItemMutation,
  useUpdateRfqItemMutation,
  usePatchRfqItemMutation,
  useDeleteRfqItemMutation,
} = requestForQuotationApi;
