import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type VendorBillSourceType =
  | "PROJECT_PO"
  | "LABOUR"
  | "SUBCONTRACTOR"
  | string;

export type VendorBillStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | string;

export type VendorBillPaymentStatus = "unpaid" | "partial" | "paid" | string;

/* ------------------------- Accounts Payable Accounts ---------------------- */

export interface AccountsPayableAccount {
  id: number;
  account_number: string;
  account_name: string;
  label: string;
  account_type: string;
  control_type: string;
  is_control_account: boolean;
}

/* ----------------------------- Line Types --------------------------------- */

export interface VendorBillLine {
  project_purchase_order_line: number | null;
  purchase_order_line: number | null;
  labour_request: number | null;
  subcontractor_milestone: number | null;
  subcontractor_request: number | null;
  description: string;
  quantity: string;
  unit_price: string;
}

/** Line payloads used when creating a vendor bill */
export interface ProjectPOLine {
  project_purchase_order_line: number;
  description: string;
  quantity?: string | number;
  unit_price?: string | number;
}

export interface LabourLine {
  labour_request: number;
  description: string;
  quantity?: string | number;
  unit_price?: string | number;
}

export interface SubcontractorMilestoneLine {
  subcontractor_milestone: number;
  description: string;
  quantity?: string | number;
  unit_price?: string | number;
}

export interface SubcontractorLumpSumLine {
  subcontractor_request: number;
  description: string;
  quantity?: string | number;
  unit_price?: string | number;
}

/* ------------------------- Full Vendor Bill Shape ------------------------- */

export interface VendorBill {
  id: number;
  lines: VendorBillLine[];
  vendor_name: string;
  bill_number: string;
  source_type: VendorBillSourceType;
  amount: string;
  due_date: string | null;
  document: string | null;
  invoice_date: string;
  status: VendorBillStatus;
  amount_paid: string;
  balance: string;
  payment_status: VendorBillPaymentStatus;
  paid_at: string | null;
  approved_at: string | null;
  project_request: number | null;
  project_purchase_order: number | null;
  purchase_order: number | string | null;
  vendor: number;
  company_bank_account: number | null;
  accounting_transaction: number | null;
  payment_term: number | null;
  approved_by: number | null;
  request_id?: number | string | null;
  vendor_details?: { vendor_name?: string | null };
  company_bank_account_details?: { bank_name?: string | null }; // bank_name
  accounts_payable_account?: number | null;
}

/* ------------------------- Create / Update Payloads ----------------------- */

interface BaseCreateVendorBill {
  vendor: number;
  invoice_date: string; // YYYY-MM-DD
  payment_term: number;
  company_bank_account: number;
  document?: string | File | null;
}

/**
 * Discriminated union – use this for type-safe construction of the body.
 * At runtime you will almost always send FormData (especially when a file is present).
 */
export type CreateVendorBillRequest =
  | (BaseCreateVendorBill & {
      source_type: "PROJECT_PO";
      project_purchase_order: number;
      project_request?: never;
      lines: ProjectPOLine[];
    })
  | (BaseCreateVendorBill & {
      source_type: "LABOUR";
      project_request: number;
      project_purchase_order?: never;
      lines: LabourLine[];
    })
  | (BaseCreateVendorBill & {
      source_type: "SUBCONTRACTOR";
      project_request: number;
      project_purchase_order?: never;
      lines: (SubcontractorMilestoneLine | SubcontractorLumpSumLine)[];
    });

export type PatchVendorBillRequest = Partial<CreateVendorBillRequest>;

/** What the mutation actually accepts */
export type CreateVendorBillBody = FormData | CreateVendorBillRequest;

/* ----------------------------- List Params -------------------------------- */

export interface GetVendorBillsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/* -------------------------------------------------------------------------- */
/*                              Base Query Helper                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   API                                      */
/* -------------------------------------------------------------------------- */

export const vendorBillsApi = createApi({
  reducerPath: "vendorBillsApi",
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

    const isFormData =
      args && typeof args === "object" && args.body instanceof FormData;

    if (isFormData) {
      // Let the browser set the correct multipart/form-data boundary
      headers.delete("content-type");
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body:
          typeof args === "string"
            ? undefined
            : args.body
              ? isFormData
                ? args.body
                : JSON.stringify(args.body)
              : undefined,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json().catch(() => null),
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
  tagTypes: ["VendorBill"],
  endpoints: (builder) => ({
    /* ---------------------------------------------------------------------- */
    /*                                List                                    */
    /* ---------------------------------------------------------------------- */
    getVendorBills: builder.query<VendorBill[], GetVendorBillsParams | void>({
      query: (params) => ({
        url: "/invoicing/vendor-bills/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "VendorBill" as const, id })),
              { type: "VendorBill", id: "LIST" },
            ]
          : [{ type: "VendorBill", id: "LIST" }],
    }),

    getPaymentQueueVendorBills: builder.query<
      VendorBill[],
      GetVendorBillsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/vendor-bills/payment_queue/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "VendorBill" as const, id })),
              { type: "VendorBill", id: "LIST" },
            ]
          : [{ type: "VendorBill", id: "LIST" }],
    }),

    getAccountsPayableAccounts: builder.query<
      AccountsPayableAccount[],
      GetVendorBillsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/vendor-bills/accounts-payable-accounts/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "VendorBill" as const, id })),
              { type: "VendorBill", id: "LIST" },
            ]
          : [{ type: "VendorBill", id: "LIST" }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                               Retrieve                                 */
    /* ---------------------------------------------------------------------- */
    getVendorBillById: builder.query<VendorBill, number>({
      query: (id) => `/invoicing/vendor-bills/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "VendorBill", id }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Create                                  */
    /* ---------------------------------------------------------------------- */
    /**
     * Create a Vendor Bill.
     * Prefer FormData when a document (file) is included.
     * Supports all source types: PROJECT_PO | LABOUR | SUBCONTRACTOR
     */
    createVendorBill: builder.mutation<VendorBill, CreateVendorBillBody>({
      query: (body) => ({
        url: "/invoicing/vendor-bills/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "VendorBill", id: "LIST" }],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Update                                  */
    /* ---------------------------------------------------------------------- */
    updateVendorBill: builder.mutation<
      VendorBill,
      { id: number; data: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    patchVendorBill: builder.mutation<
      VendorBill,
      { id: number; data: PatchVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    /* ---------------------------------------------------------------------- */
    /*                                Delete                                  */
    /* ---------------------------------------------------------------------- */
    deleteVendorBill: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/vendor-bills/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    /* ---------------------------------------------------------------------- */
    /*                          Action Endpoints                              */
    /* ---------------------------------------------------------------------- */
    approveVendorBill: builder.mutation<
      VendorBill,
      { id: number; data?: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/approve/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    cancelVendorBill: builder.mutation<
      VendorBill,
      { id: number; data?: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/cancel/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    payVendorBill: builder.mutation<
      VendorBill,
      { id: number; data?: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/pay/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    rejectVendorBill: builder.mutation<
      VendorBill,
      { id: number; data?: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/reject/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),

    submitVendorBill: builder.mutation<
      VendorBill,
      { id: number; data?: CreateVendorBillRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/vendor-bills/${id}/submit/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "VendorBill", id },
        { type: "VendorBill", id: "LIST" },
      ],
    }),
  }),
});

/* -------------------------------------------------------------------------- */
/*                                   Hooks                                    */
/* -------------------------------------------------------------------------- */

export const {
  // Queries
  useGetVendorBillsQuery,
  useGetPaymentQueueVendorBillsQuery,
  useGetVendorBillByIdQuery,
  useLazyGetVendorBillsQuery,
  useLazyGetVendorBillByIdQuery,
  useGetAccountsPayableAccountsQuery,
  useLazyGetAccountsPayableAccountsQuery,

  // Mutations
  useCreateVendorBillMutation,
  useUpdateVendorBillMutation,
  usePatchVendorBillMutation,
  useDeleteVendorBillMutation,
  useApproveVendorBillMutation,
  useCancelVendorBillMutation,
  usePayVendorBillMutation,
  useRejectVendorBillMutation,
  useSubmitVendorBillMutation,
} = vendorBillsApi;
