import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import type { PurchaseOrderStatus } from "@/components/purchase/types";

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

export interface LocationManagerDetails {
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

export interface StoreKeeperDetails {
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
export interface PurchaseOrderItem {
  id: number;
  url: string;
  purchase_order: string;
  product: number;
  product_details: ProductDetails;
  qty: number;
  estimated_unit_price: string;
  total_price: string;
}

export interface DestinationLocationDetails {
  id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  address: string;
  location_manager: number;
  location_manager_details: LocationManagerDetails;
  store_keeper: number;
  store_keeper_details: StoreKeeperDetails;
  contact_information: string;
  is_hidden: boolean;
}

export interface PurchaseOrder {
  id: string;
  url: string;
  status: PurchaseOrderStatus;
  date_created: string;
  date_updated: string;
  related_rfq: string;
  created_by: number;
  vendor: number;
  currency: number;
  payment_terms: string;
  destination_location: string;
  created_by_details: UserDetails;
  purchase_policy: string;
  delivery_terms: string;
  items: PurchaseOrderItem[];
  po_total_price: string;
  vendor_details: VendorDetails;
  is_hidden: boolean;
  is_submitted: boolean;
  can_edit: boolean;
  currency_details: CurrencyDetails;
  destination_location_details: DestinationLocationDetails;
}

// Define query parameter types
export interface GetPurchaseOrdersParams {
  created_by__user_id?: number;
  date_created?: string;
  destination_location__id?: string;
  search?: string;
  status?: PurchaseOrderStatus;
  [key: string]: string | number | boolean | undefined;
}

// Define request body types
export interface CreatePurchaseOrderItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface UpdatePurchaseOrderItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface PatchPurchaseOrderItemRequest {
  product?: number;
  qty?: number;
  estimated_unit_price?: string;
}

export interface CreatePurchaseOrderRequest {
  status?: PurchaseOrderStatus;
  related_rfq?: string;
  created_by: number;
  vendor: number;
  currency: number;
  payment_terms: string | number;
  destination_location: string | number;
  purchase_policy?: string;
  delivery_terms?: string;
  items: CreatePurchaseOrderItemRequest[];
  is_hidden?: boolean;
  is_submitted?: boolean;
  can_edit?: boolean;
}

export interface UpdatePurchaseOrderRequest {
  status?: PurchaseOrderStatus;
  related_rfq?: string;
  created_by?: number;
  vendor?: number;
  currency?: number;
  payment_terms?: string | number;
  destination_location?: string | number;
  purchase_policy?: string;
  delivery_terms?: string;
  items?: UpdatePurchaseOrderItemRequest[];
  is_hidden?: boolean;
  is_submitted?: boolean;
  can_edit?: boolean;
}

export interface PatchPurchaseOrderRequest {
  status?: PurchaseOrderStatus;
  related_rfq?: string;
  created_by?: number;
  vendor?: number;
  currency?: number;
  payment_terms?: string | number;
  destination_location?: string | number;
  purchase_policy?: string;
  delivery_terms?: string;
  items?: PatchPurchaseOrderItemRequest[];
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

export const purchaseOrderApi = createApi({
  reducerPath: "purchaseOrderApi",
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
    // Purchase Order Query endpoints
    getPurchaseOrders: builder.query<PurchaseOrder[], GetPurchaseOrdersParams>({
      query: (params) => ({
        url: "/purchase/purchase-order/",
        params,
      }),
    }),
    getPurchaseOrder: builder.query<PurchaseOrder, string>({
      query: (id) => `/purchase/purchase-order/${id}/`,
    }),

    // Purchase Order Mutation endpoints
    createPurchaseOrder: builder.mutation<
      PurchaseOrder,
      CreatePurchaseOrderRequest
    >({
      query: (body) => ({
        url: "/purchase/purchase-order/",
        method: "POST",
        body,
      }),
    }),
    updatePurchaseOrder: builder.mutation<
      PurchaseOrder,
      { id: string; data: UpdatePurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-order/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPurchaseOrder: builder.mutation<
      PurchaseOrder,
      { id: string; data: PatchPurchaseOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-order/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    // Purchase Order Item Query endpoints (if needed separately)
    getPurchaseOrderItems: builder.query<
      PurchaseOrderItem[],
      { purchase_order__id?: string }
    >({
      query: (params) => ({
        url: "/purchase/purchase-order-items/",
        params,
      }),
    }),
    getPurchaseOrderItem: builder.query<PurchaseOrderItem, number>({
      query: (id) => `/purchase/purchase-order-items/${id}/`,
    }),

    // Purchase Order Item Mutation endpoints (if needed separately)
    createPurchaseOrderItem: builder.mutation<
      PurchaseOrderItem,
      CreatePurchaseOrderItemRequest
    >({
      query: (body) => ({
        url: "/purchase/purchase-order-items/",
        method: "POST",
        body,
      }),
    }),
    updatePurchaseOrderItem: builder.mutation<
      PurchaseOrderItem,
      { id: number; data: UpdatePurchaseOrderItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-order-items/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPurchaseOrderItem: builder.mutation<
      PurchaseOrderItem,
      { id: number; data: PatchPurchaseOrderItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-order-items/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deletePurchaseOrderItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/purchase-order-items/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  // Purchase Order hooks
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  usePatchPurchaseOrderMutation,

  // Purchase Order Item hooks
  useGetPurchaseOrderItemsQuery,
  useGetPurchaseOrderItemQuery,
  useCreatePurchaseOrderItemMutation,
  useUpdatePurchaseOrderItemMutation,
  usePatchPurchaseOrderItemMutation,
  useDeletePurchaseOrderItemMutation,
} = purchaseOrderApi;
