import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type VendorType = "supplier" | "contractor" | string;
export type VendorStatus = "active" | "inactive" | string;

export const VENDOR_TYPE_CHOICES = [
  { value: "supplier", label: "Supplier" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "labour", label: "Labour" },
  { value: "service", label: "Service Provider" },
] as const;

export const VENDOR_TYPE_VALUES = VENDOR_TYPE_CHOICES.map((c) => c.value);

export const isVendorType = (
  value: unknown,
): value is (typeof VENDOR_TYPE_CHOICES)[number]["value"] =>
  VENDOR_TYPE_VALUES.includes(
    value as (typeof VENDOR_TYPE_CHOICES)[number]["value"],
  );

export interface VendorBankAccount {
  id?: number;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  branch_code?: string | null;
  confirmed?: boolean;
  updated_at?: string;
  updated_by?: number;
}

export interface VendorListItem {
  id: number;
  vendor_code: string;
  vendor_name: string;
  vendor_type: VendorType;
  email: string;
  phone_number: string;
  status: VendorStatus;
  created_on: string;
  updated_on: string;
  payment_term: number | null;
}

export interface VendorFull {
  id: number;
  vendor_code: string;
  vendor_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  tax_id: string | null;
  tax_registered: boolean | null;
  tax_number: string | null;
  vendor_type: VendorType;
  status: VendorStatus;
  bank_account: VendorBankAccount | null; // always object or null
  payment_term: number | null;
  payment_term_details?: { name?: string } | null;
  created_on: string;
  updated_on: string;
  vendor_type_display?: string;
}

export interface CreateVendorRequest {
  vendor_name: string;
  contact_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  tax_id?: string;
  tax_registered?: boolean;
  tax_number?: string;
  payment_term?: number | null;
  vendor_type: VendorType;
  status?: VendorStatus;
  /** Nested bank details – backend accepts this on create */
  bank_account?: {
    bank_account_name: string;
    bank_account_number: string;
    bank_name: string;
    branch_code?: string;
  } | null;
}

export type UpdateVendorRequest = Omit<CreateVendorRequest, "bank_account">;
export type PatchVendorRequest = Partial<UpdateVendorRequest>;

export interface GetVendorsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const vendorsApi = createApi({
  reducerPath: "invoiceVendorsApi",
  tagTypes: ["Vendors"],
  baseQuery: async (args, api, _extraOptions) => {
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

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
          },
        };
      }

      if (response.status === 204) {
        return { data: null };
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
    getVendors: builder.query<VendorListItem[], GetVendorsParams | void>({
      query: (params) => ({
        url: "/invoicing/vendors/",
        params,
      }),
      providesTags: ["Vendors"],
    }),
    createVendor: builder.mutation<CreateVendorRequest, CreateVendorRequest>({
      query: (body) => ({
        url: "/invoicing/vendors/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Vendors"],
    }),
    getVendorById: builder.query<VendorFull, number>({
      query: (id) => `/invoicing/vendors/${id}/`,
    }),
    updateVendor: builder.mutation<
      CreateVendorRequest,
      { id: number; data: UpdateVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Vendors"],
    }),
    patchVendor: builder.mutation<
      CreateVendorRequest,
      { id: number; data: PatchVendorRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Vendors"],
    }),
    deleteVendor: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/vendors/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vendors"],
    }),
    activateVendor: builder.mutation<
      VendorFull,
      { id: number; data?: Partial<CreateVendorRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/activate/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: ["Vendors"],
    }),
    getVendorPaymentStatus: builder.query<VendorFull, number>({
      query: (id) => `/invoicing/vendors/${id}/payment-status/`,
    }),
    getActiveVendors: builder.query<VendorFull[], void>({
      query: () => "/invoicing/vendors/active/",
      providesTags: ["Vendors"],
    }),
    getVendorsByType: builder.query<VendorFull[], void>({
      query: () => "/invoicing/vendors/by-type/",
      providesTags: ["Vendors"],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
  usePatchVendorMutation,
  useDeleteVendorMutation,
  useActivateVendorMutation,
  useGetVendorPaymentStatusQuery,
  useGetActiveVendorsQuery,
  useGetVendorsByTypeQuery,
} = vendorsApi;
