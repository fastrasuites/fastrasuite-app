import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";
import { VendorFull, CreateVendorRequest } from "./vendorsApi";

export interface VendorBankAccountRequest {
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  branch_code: string;
}

/**
 * Request body for confirming a vendor bank account.
 * Matches the schema of POST /invoicing/vendors/{id}/bank-account/confirm/
 */
export interface ConfirmVendorBankAccountRequest {
  vendor_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  tax_id: string;
  tax_registered: boolean;
  tax_number: string;
  vendor_type: "supplier" | string; // adjust union if you have a stricter type
  status: "active" | string; // adjust union if you have a stricter type
  payment_term: number;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const vendorBankAccountsApi = createApi({
  reducerPath: "vendorBankAccountsApi",
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
    addVendorBankAccount: builder.mutation<
      VendorFull,
      { id: number; data?: VendorBankAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/bank-account/`,
        method: "POST",
        body: data || {},
      }),
    }),

    updateVendorBankAccount: builder.mutation<
      VendorBankAccountRequest,
      { id: number; data: VendorBankAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/bank-account/`,
        method: "PUT",
        body: data,
      }),
    }),

    /**
     * Confirm a vendor's bank account.
     * POST /invoicing/vendors/{id}/bank-account/confirm/
     */
    confirmVendorBankAccount: builder.mutation<
      VendorFull,
      { id: number; data: ConfirmVendorBankAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendors/${id}/bank-account/confirm/`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useAddVendorBankAccountMutation,
  useUpdateVendorBankAccountMutation,
  useConfirmVendorBankAccountMutation,
} = vendorBankAccountsApi;
