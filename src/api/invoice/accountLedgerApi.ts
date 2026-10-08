import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export type AccountLedgerTransactionType =
  | "vendor_bill"
  | "vendor_payment"
  | "customer_payment"
  | "disbursement"
  | "receipt"
  | "journal"
  | "inventory"
  | "expense";

export type AccountLedgerPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

export interface AccountLedgerEntry {
  id: number;
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
  wbs:
    | string
    | {
        id: string;
        name: string;
        serial_number?: number;
        phase?: {
          id: string;
          name: string;
          code: string;
        };
        project?: {
          id: number;
          project_code: string;
          name: string;
        };
      }
    | null;
  running_balance: string;
  description: string;
  reference_number: string;
  transaction_date: string;
  transaction_type: AccountLedgerTransactionType;
}

export interface AccountLedgerSummary {
  id: number;
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
  balance: number;
}

export interface AccountLedgerDetail {
  account: {
    id: number;
    account_code: string;
    account_name: string;
  };
  debit: number;
  credit: number;
  balance: number;
  opening_balance: number;
  entries: AccountLedgerEntry[];
}

export interface AccountLedgerListParams {
  account?: number;
  ordering?: string;
  search?: string;
  source_model?: string;
  transaction?: number;
  transaction_type?: AccountLedgerTransactionType;
  vendor?: number;
  wbs_element?: string;
  created_by?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  debit_max?: number;
  debit_min?: number;
  credit_max?: number;
  credit_min?: number;
  period?: AccountLedgerPeriod;
  [key: string]: string | number | boolean | undefined;
}

export interface AccountLedgerByIdParams extends AccountLedgerListParams {
  id: number;
}

export interface AccountLedgerExportParams {
  account?: number;
  export_format?: "excel" | "pdf";
  vendor?: number;
  wbs_element?: string;
  transaction?: number;
  created_by?: number;
  transaction_type?: AccountLedgerTransactionType;
  source_model?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  debit_max?: number;
  debit_min?: number;
  credit_max?: number;
  credit_min?: number;
  period?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const accountLedgerApi = createApi({
  reducerPath: "accountLedgerApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  tagTypes: ["AccountLedger"],
  endpoints: (builder) => ({
    getAccountLedger: builder.query<
      AccountLedgerSummary[],
      AccountLedgerListParams | void
    >({
      query: (params) => ({
        url: "/invoicing/account-ledger/",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "AccountLedger" as const,
                id,
              })),
              { type: "AccountLedger", id: "LIST" },
            ]
          : [{ type: "AccountLedger", id: "LIST" }],
    }),

    /** Detail supports same date/period filters as the list. */
    getAccountLedgerById: builder.query<
      AccountLedgerDetail,
      number | AccountLedgerByIdParams
    >({
      query: (arg) => {
        if (typeof arg === "number") {
          return `/invoicing/account-ledger/${arg}/`;
        }
        const { id, ...params } = arg;
        return {
          url: `/invoicing/account-ledger/${id}/`,
          params,
        };
      },
      providesTags: (_result, _error, arg) => [
        {
          type: "AccountLedger",
          id: typeof arg === "number" ? arg : arg.id,
        },
      ],
    }),

    exportAccountLedger: builder.query<any, AccountLedgerExportParams>({
      query: (params) => ({
        url: "/invoicing/account-ledger/export/",
        params: params || undefined,
      }),
    }),
  }),
});

export const {
  useGetAccountLedgerQuery,
  useLazyGetAccountLedgerQuery,
  useGetAccountLedgerByIdQuery,
  useLazyGetAccountLedgerByIdQuery,
  useExportAccountLedgerQuery,
} = accountLedgerApi;
