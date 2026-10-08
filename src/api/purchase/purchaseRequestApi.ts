import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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
export interface PurchaseRequestItem {
  id: number;
  purchase_request: string;
  product: number;
  product_details: ProductDetails;
  qty: number;
  estimated_unit_price: string;
}

export interface RequestingLocationDetails {
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

export interface PurchaseRequest {
  url: string;
  id: string;
  status: "draft" | "approved" | "pending" | "rejected";
  date_created: string;
  date_updated: string;
  currency: number;
  requester: number;
  requester_details: UserDetails;
  requesting_location: string;
  purpose: string;
  vendor: number;
  items: PurchaseRequestItem[];
  pr_total_price: string;
  can_edit: boolean;
  is_submitted: boolean;
  is_hidden: boolean;
  requesting_location_details: RequestingLocationDetails;
  currency_details: CurrencyDetails;
  vendor_details: VendorDetails;
}

// Define query parameter types
export interface GetPurchaseRequestsParams {
  date_created?: string;
  requester__user_id?: number;
  requesting_location__id?: string;
  search?: string;
  status?: "approved" | "draft" | "pending" | "rejected";
  [key: string]: string | number | boolean | undefined;
}

export interface GetPurchaseRequestItemsParams {
  purchase_request__id?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Define request body types
export interface CreatePurchaseRequestItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface UpdatePurchaseRequestItemRequest {
  product: number;
  qty: number;
  estimated_unit_price: string;
}

export interface PatchPurchaseRequestItemRequest {
  product?: number;
  qty?: number;
  estimated_unit_price?: string;
}

export interface CreatePurchaseRequestRequest {
  status?: "draft" | "approved" | "pending" | "rejected";
  currency: number;
  requester: number;
  requesting_location: string;
  purpose: string;
  vendor: number;
  items: CreatePurchaseRequestItemRequest[];
  can_edit?: boolean;
  is_submitted?: boolean;
  is_hidden?: boolean;
}

export interface UpdatePurchaseRequestRequest {
  status?: "draft" | "approved" | "pending" | "rejected";
  currency?: number;
  requester?: number;
  requesting_location?: string;
  purpose?: string;
  vendor?: number;
  items?: UpdatePurchaseRequestItemRequest[];
  can_edit?: boolean;
  is_submitted?: boolean;
  is_hidden?: boolean;
}

export interface PatchPurchaseRequestRequest {
  status?: "draft" | "approved" | "pending" | "rejected";
  currency?: number;
  requester?: number;
  requesting_location?: string;
  purpose?: string;
  vendor?: number;
  items?: PatchPurchaseRequestItemRequest[];
  can_edit?: boolean;
  is_submitted?: boolean;
  is_hidden?: boolean;
}

export const purchaseRequestApi = createApi({
  reducerPath: "purchaseRequestApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Purchase Request Query endpoints
    getPurchaseRequests: builder.query<
      PurchaseRequest[],
      GetPurchaseRequestsParams
    >({
      query: (params) => ({
        url: "/purchase/purchase-request/",
        params,
      }),
    }),
    getPurchaseRequest: builder.query<PurchaseRequest, string>({
      query: (id) => `/purchase/purchase-request/${id}/`,
    }),
    getApprovedPurchaseRequests: builder.query<PurchaseRequest[], void>({
      query: () => ({
        url: "/purchase/purchase-request/approved_list/",
      }),
    }),

    // Purchase Request Mutation endpoints
    createPurchaseRequest: builder.mutation<
      PurchaseRequest,
      CreatePurchaseRequestRequest
    >({
      query: (body) => ({
        url: "/purchase/purchase-request/",
        method: "POST",
        body,
      }),
    }),
    updatePurchaseRequest: builder.mutation<
      PurchaseRequest,
      { id: string; data: UpdatePurchaseRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-request/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPurchaseRequest: builder.mutation<
      PurchaseRequest,
      { id: string; data: PatchPurchaseRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-request/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    // Purchase Request Item Query endpoints
    getPurchaseRequestItems: builder.query<
      PurchaseRequestItem[],
      GetPurchaseRequestItemsParams
    >({
      query: (params) => ({
        url: "/purchase/purchase-request-items/",
        params,
      }),
    }),
    getPurchaseRequestItem: builder.query<PurchaseRequestItem, number>({
      query: (id) => `/purchase/purchase-request-items/${id}/`,
    }),

    // Purchase Request Item Mutation endpoints
    createPurchaseRequestItem: builder.mutation<
      PurchaseRequestItem,
      CreatePurchaseRequestItemRequest
    >({
      query: (body) => ({
        url: "/purchase/purchase-request-items/",
        method: "POST",
        body,
      }),
    }),
    updatePurchaseRequestItem: builder.mutation<
      PurchaseRequestItem,
      { id: number; data: UpdatePurchaseRequestItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-request-items/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPurchaseRequestItem: builder.mutation<
      PurchaseRequestItem,
      { id: number; data: PatchPurchaseRequestItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/purchase-request-items/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deletePurchaseRequestItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/purchase-request-items/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  // Purchase Request hooks
  useGetPurchaseRequestsQuery,
  useGetPurchaseRequestQuery,
  useGetApprovedPurchaseRequestsQuery,
  useCreatePurchaseRequestMutation,
  useUpdatePurchaseRequestMutation,
  usePatchPurchaseRequestMutation,

  // Purchase Request Item hooks
  useGetPurchaseRequestItemsQuery,
  useGetPurchaseRequestItemQuery,
  useCreatePurchaseRequestItemMutation,
  useUpdatePurchaseRequestItemMutation,
  usePatchPurchaseRequestItemMutation,
  useDeletePurchaseRequestItemMutation,
} = purchaseRequestApi;
