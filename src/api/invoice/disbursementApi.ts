import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DisbursementSourceType = "PETTY_CASH" | string;

export type DisbursementMethod = "CASH" | "BANK_TRANSFER" | string;

export type DisbursementStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | string;

/* ------------------------- Full Disbursement Shape ------------------------ */

export interface Disbursement {
  id: number;
  petty_cash_reference: string;
  bank_account_name: string;
  created_by_name: string;
  approved_by_name: string;
  reference_number: string;
  source_type: DisbursementSourceType;
  disbursement_method: DisbursementMethod;
  amount: string;
  payment_date: string | null;
  status: DisbursementStatus;
  payment_reference: string | null;
  notes: string | null;
  approved_at: string | null;
  paid_at: string | null;
  petty_cash_request: number;
  company_bank_account: number | null;
  /** Cash float / payment account (cash method) */
  payment_account?: number | null;
  /** GL expense account */
  expense_account?: number | null;
  created_by: number;
  approved_by: number | null;

  recipient_name?: string | null;
  cash_received?: boolean | null;

  recipient_bank_name?: string | null;
  recipient_account_number?: string | null;
  recipient_account_name?: string | null;

  document?: string | null;
}

/* -------------------- Expense / Payment option accounts ------------------- */

/** Chart-of-account style option returned by expense-accounts & payment-options */
export interface DisbursementAccountOption {
  id: number;
  account_number?: string;
  account_name?: string;
  name?: string;
  account_type?: string;
  subtype?: string;
  is_active?: boolean;
  /** Present on payment-options company bank accounts */
  bank_name?: string;
  account?: number;
  account__account_number?: string;
  account__account_name?: string;
  currency_id?: number;
  [key: string]: unknown;
}

/** Wrapper shapes returned by the list endpoints */
export interface ExpenseAccountsResponse {
  expense_accounts: DisbursementAccountOption[];
}

export interface PaymentOptionsResponse {
  company_bank_accounts?: DisbursementAccountOption[];
  payment_accounts?: DisbursementAccountOption[];
}

/* ------------------------- Create / Update Payloads ----------------------- */

interface BaseCreateDisbursement {
  source_type: "PETTY_CASH";
  petty_cash_request: number;
  /** Required – GL expense account */
  expense_account: number;
  payment_reference?: string;
  notes?: string;
  document?: string | File | null;
}

/** Cash hand-out – uses payment_account (cash CoA), not company_bank_account */
export type CreateCashDisbursement = BaseCreateDisbursement & {
  disbursement_method: "CASH";
  payment_account: number;
  recipient_name: string;
  /** Approved amount from the petty-cash request */
  amount?: string | number;
  cash_received?: boolean;
  company_bank_account?: never;
  recipient_bank_name?: never;
  recipient_account_number?: never;
  recipient_account_name?: never;
};

/** Bank transfer – uses company_bank_account */
export type CreateBankTransferDisbursement = BaseCreateDisbursement & {
  disbursement_method: "BANK_TRANSFER";
  company_bank_account: number;
  recipient_bank_name: string;
  recipient_account_number: string;
  recipient_account_name: string;
  /** Optional display name; some backends also accept recipient_name */
  recipient_name?: string;
  cash_received?: false;
  payment_account?: never;
};

export type CreateDisbursementRequest =
  | CreateCashDisbursement
  | CreateBankTransferDisbursement;

export type CreateDisbursementBody = FormData | CreateDisbursementRequest;

export interface UpdateDisbursementRequest {
  company_bank_account?: number;
  payment_account?: number;
  expense_account?: number;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  document?: string | File | null;
  recipient_name?: string;
  cash_received?: boolean;
  recipient_bank_name?: string;
  recipient_account_number?: string;
  recipient_account_name?: string;
}

export type PatchDisbursementRequest = Partial<UpdateDisbursementRequest>;

export type DisbursementActionBody =
  | CreateDisbursementRequest
  | UpdateDisbursementRequest
  | Record<string, unknown>
  | FormData
  | undefined
  | null;

export interface GetDisbursementsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface GetPaymentOptionsParams {
  method: "CASH" | "BANK_TRANSFER" | string;
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

export const disbursementsApi = createApi({
  reducerPath: "disbursementsApi",
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
  tagTypes: ["Disbursement"],
  endpoints: (builder) => ({
    getDisbursements: builder.query<
      Disbursement[],
      GetDisbursementsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/disbursements/",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Disbursement" as const,
                id,
              })),
              { type: "Disbursement", id: "LIST" },
            ]
          : [{ type: "Disbursement", id: "LIST" }],
    }),

    getDisbursementById: builder.query<Disbursement, number>({
      query: (id) => `/invoicing/disbursements/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Disbursement", id }],
    }),

    /** Expense (GL) accounts eligible for a disbursement */
    getExpenseAccounts: builder.query<
      ExpenseAccountsResponse | DisbursementAccountOption[],
      void
    >({
      query: () => ({
        url: "/invoicing/disbursements/expense-accounts/",
      }),
    }),

    /**
     * Payment source accounts.
     * ?method=CASH → cash / float CoA options
     * ?method=BANK_TRANSFER → bank accounts usable as company_bank_account
     */
    getPaymentOptions: builder.query<
      PaymentOptionsResponse | DisbursementAccountOption[],
      GetPaymentOptionsParams
    >({
      query: ({ method }) => ({
        url: "/invoicing/disbursements/payment-options/",
        params: { method },
      }),
    }),

    createDisbursement: builder.mutation<Disbursement, CreateDisbursementBody>({
      query: (body) => ({
        url: "/invoicing/disbursements/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Disbursement", id: "LIST" }],
    }),

    updateDisbursement: builder.mutation<
      Disbursement,
      { id: number; data: UpdateDisbursementRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    patchDisbursement: builder.mutation<
      Disbursement,
      { id: number; data: PatchDisbursementRequest | FormData }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    deleteDisbursement: builder.mutation<
      void,
      number | { id: number; data?: DisbursementActionBody }
    >({
      query: (arg) => {
        const id = typeof arg === "number" ? arg : arg.id;
        const body = typeof arg === "number" ? undefined : arg.data;
        return {
          url: `/invoicing/disbursements/${id}/`,
          method: "DELETE",
          body,
        };
      },
      invalidatesTags: (_result, _error, arg) => {
        const id = typeof arg === "number" ? arg : arg.id;
        return [
          { type: "Disbursement", id },
          { type: "Disbursement", id: "LIST" },
        ];
      },
    }),

    approveDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/approve/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    cancelDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/cancel/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    payDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/pay/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    rejectDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/reject/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),

    submitDisbursement: builder.mutation<
      Disbursement,
      { id: number; data?: DisbursementActionBody }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/disbursements/${id}/submit/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Disbursement", id },
        { type: "Disbursement", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDisbursementsQuery,
  useGetDisbursementByIdQuery,
  useLazyGetDisbursementsQuery,
  useLazyGetDisbursementByIdQuery,
  useGetExpenseAccountsQuery,
  useGetPaymentOptionsQuery,
  useLazyGetPaymentOptionsQuery,
  useCreateDisbursementMutation,
  useUpdateDisbursementMutation,
  usePatchDisbursementMutation,
  useDeleteDisbursementMutation,
  useApproveDisbursementMutation,
  useCancelDisbursementMutation,
  usePayDisbursementMutation,
  useRejectDisbursementMutation,
  useSubmitDisbursementMutation,
} = disbursementsApi;
