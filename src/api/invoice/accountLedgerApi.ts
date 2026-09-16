import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type AccountLedgerTransactionType =
  | "vendor_bill"
  | "vendor_payment"
  | "customer_payment"
  | "disbursement"
  | "receipt"
  | "journal"
  | "inventory"
  | "expense";

export interface AccountLedgerEntry {
  id: number;
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
  wbs: string | null;
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
  period?: "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "last_year";
  [key: string]: string | number | boolean | undefined;
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

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1") ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const accountLedgerApi = createApi({
  reducerPath: "accountLedgerApi",
  baseQuery: async (args, api, _extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) headers.set("authorization", `Bearer ${token}`);
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
        body: typeof args === "string" ? undefined : args.body ? JSON.stringify(args.body) : undefined,
      });

      if (!response.ok) {
        return { error: { status: response.status, data: await response.json().catch(() => null) } };
      }

      if (response.status === 204) return { data: null };

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        return { data };
      } else {
        const blob = await response.blob();
        const disposition = response.headers.get("content-disposition");
        const filename = disposition ? disposition.split("filename=")[1] : `account-ledger-export.${url.includes("pdf") ? "pdf" : "xlsx"}`;
        return { data: { blob, filename, url: URL.createObjectURL(blob), contentType: response.headers.get("content-type") } };
      }
    } catch (error) {
      return { error: { status: "FETCH_ERROR" as const, data: error } };
    }
  },
  tagTypes: ["AccountLedger"],
  endpoints: (builder) => ({
    getAccountLedger: builder.query<AccountLedgerSummary[], AccountLedgerListParams | void>({
      query: (params) => ({ url: "/invoicing/account-ledger/", params: params || undefined }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "AccountLedger" as const, id })), { type: "AccountLedger", id: "LIST" }]
          : [{ type: "AccountLedger", id: "LIST" }],
    }),

    getAccountLedgerById: builder.query<AccountLedgerDetail, number>({
      query: (id) => `/invoicing/account-ledger/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "AccountLedger", id }],
    }),

    exportAccountLedger: builder.query<any, AccountLedgerExportParams>({
      query: (params) => ({ url: "/invoicing/account-ledger/export/", params: params || undefined }),
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