import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
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

export const vendorBankAccountsApi = createApi({
  reducerPath: "vendorBankAccountsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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
