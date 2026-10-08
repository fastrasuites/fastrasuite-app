import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE";
export type AccountSubtype = "bank" | "inventory" | string;
export type ControlType =
  | "accounts_payable"
  | "accounts_receivable"
  | "bank"
  | "inventory"
  | string;

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

/** Nested child nodes share the same shape as the parent (recursive tree). */
export interface ChartOfAccountDetail extends ChartOfAccountSummary {
  children: ChartOfAccountDetail[];
  created_at?: string;
}

/** Response from GET /invoicing/chart-of-accounts/grouped/ */
export type ChartOfAccountsGrouped = Partial<
  Record<AccountType, ChartOfAccountDetail[]>
>;

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

export const chartOfAccountsApi = createApi({
  reducerPath: "chartOfAccountsApi",
  tagTypes: ["ChartOfAccount"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getChartOfAccounts: builder.query<
      ChartOfAccountSummary[],
      GetChartOfAccountsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/chart-of-accounts/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["ChartOfAccount"],
    }),

    getChartOfAccountsGrouped: builder.query<ChartOfAccountsGrouped, void>({
      query: () => ({
        url: "/invoicing/chart-of-accounts/grouped/",
      }),
      providesTags: [{ type: "ChartOfAccount", id: "GROUPED" }],
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
  useGetChartOfAccountsGroupedQuery,
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
