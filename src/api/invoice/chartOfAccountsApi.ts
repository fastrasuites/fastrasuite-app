import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
export type AccountSubtype = "bank" | "inventory" | string;
export type ControlType = "accounts_payable" | "accounts_receivable" | "bank" | "inventory" | string;

export interface ChartOfAccountSummary {
  id: number;
  account_number: string;
  account_name: string;
  account_type: AccountType;
  subtype: AccountSubtype;
  is_active: boolean;
  is_control_account: boolean;
  control_type: ControlType;
  parent_account: number | null;
  parent_account_name?: string;
  balance: string;
  children?: any[];
}

export interface ChartOfAccountDetail extends ChartOfAccountSummary {
  children: Array<{
    id: number;
    account_number: string;
    account_name: string;
    balance: string;
  }>;
  created_at: string;
}

export interface CreateChartOfAccountRequest {
  account_number: string;
  account_name: string;
  account_type: AccountType;
  subtype: AccountSubtype;
  parent_account?: number | null;
  is_active: boolean;
  is_control_account: boolean;
  control_type?: ControlType;
}

export interface UpdateChartOfAccountRequest extends CreateChartOfAccountRequest {}

export interface PatchChartOfAccountRequest extends Partial<CreateChartOfAccountRequest> {}

export interface GetChartOfAccountsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const chartOfAccountsApi = createApi({
  reducerPath: "chartOfAccountsApi",
  tagTypes: ["ChartOfAccount"],
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
    getChartOfAccounts: builder.query<
      ChartOfAccountSummary[],
      GetChartOfAccountsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/chart-of-accounts/",
        params,
      }),
      providesTags: ["ChartOfAccount"],
    }),
    createChartOfAccount: builder.mutation<
      ChartOfAccountSummary,
      CreateChartOfAccountRequest
    >({
      query: (body) => ({
        url: "/invoicing/chart-of-accounts/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountById: builder.query<ChartOfAccountDetail, number>({
      query: (id) => `/invoicing/chart-of-accounts/${id}/`,
      providesTags: ["ChartOfAccount"],
    }),
    updateChartOfAccount: builder.mutation<
      ChartOfAccountSummary,
      { id: number; data: UpdateChartOfAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/chart-of-accounts/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ChartOfAccount"],
    }),
    patchChartOfAccount: builder.mutation<
      ChartOfAccountSummary,
      { id: number; data: PatchChartOfAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/chart-of-accounts/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ChartOfAccount"],
    }),
    deleteChartOfAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/chart-of-accounts/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountBalance: builder.query<ChartOfAccountSummary, number>({
      query: (id) => `/invoicing/chart-of-accounts/${id}/balance/`,
      providesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountLedger: builder.query<ChartOfAccountSummary, number>({
      query: (id) => `/invoicing/chart-of-accounts/${id}/ledger/`,
      providesTags: ["ChartOfAccount"],
    }),
    getActiveChartOfAccounts: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/active/",
      providesTags: ["ChartOfAccount"],
    }),
    getBankChartAccounts: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/bank-accounts/",
      providesTags: ["ChartOfAccount"],
    }),
    getControlAccounts: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/control-accounts/",
      providesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountsDropdown: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/dropdown/",
      providesTags: ["ChartOfAccount"],
    }),
    getExpenseAccounts: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/expense-accounts/",
      providesTags: ["ChartOfAccount"],
    }),
    getParentAccounts: builder.query<ChartOfAccountSummary[], void>({
      query: () => "/invoicing/chart-of-accounts/parent-accounts/",
      providesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountsSummary: builder.query<any, void>({
      query: () => "/invoicing/chart-of-accounts/summary/",
      providesTags: ["ChartOfAccount"],
    }),
    getChartOfAccountsTree: builder.query<any, void>({
      query: () => "/invoicing/chart-of-accounts/tree/",
      providesTags: ["ChartOfAccount"],
    }),
  }),
});

export const {
  useGetChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useGetChartOfAccountByIdQuery,
  useUpdateChartOfAccountMutation,
  usePatchChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetChartOfAccountBalanceQuery,
  useGetChartOfAccountLedgerQuery,
  useGetActiveChartOfAccountsQuery,
  useGetBankChartAccountsQuery,
  useGetControlAccountsQuery,
  useGetChartOfAccountsDropdownQuery,
  useGetExpenseAccountsQuery,
  useGetParentAccountsQuery,
  useGetChartOfAccountsSummaryQuery,
  useGetChartOfAccountsTreeQuery,
} = chartOfAccountsApi;
