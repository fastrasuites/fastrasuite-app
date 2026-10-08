import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface CompanyBankAccount {
  id: number;
  account_name: string;
  account_number_display: string;
  currency_name: string;
  bank_name: string;
  account_number: string;
  branch_code: string;
  is_active: boolean;
  account: number;
  currency: number;
}

export interface CreateCompanyBankAccountRequest {
  bank_name: string;
  account_number: string;
  branch_code: string;
  is_active: boolean;
  account: number;
  currency: number;
}

export interface UpdateCompanyBankAccountRequest extends CreateCompanyBankAccountRequest {}

export interface PatchCompanyBankAccountRequest extends Partial<CreateCompanyBankAccountRequest> {}

export interface GetCompanyBankAccountsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const companyBankAccountsApi = createApi({
  reducerPath: "companyBankAccountsApi",
  tagTypes: ["CompanyBankAccount"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getCompanyBankAccounts: builder.query<
      CompanyBankAccount[],
      GetCompanyBankAccountsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/company-bank-accounts/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["CompanyBankAccount"],
    }),
    createCompanyBankAccount: builder.mutation<
      CompanyBankAccount,
      CreateCompanyBankAccountRequest
    >({
      query: (body) => ({
        url: "/invoicing/company-bank-accounts/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CompanyBankAccount"],
    }),
    getCompanyBankAccountById: builder.query<CompanyBankAccount, number>({
      query: (id) => `/invoicing/company-bank-accounts/${id}/`,
      providesTags: ["CompanyBankAccount"],
    }),
    updateCompanyBankAccount: builder.mutation<
      CompanyBankAccount,
      { id: number; data: UpdateCompanyBankAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/company-bank-accounts/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CompanyBankAccount"],
    }),
    patchCompanyBankAccount: builder.mutation<
      CompanyBankAccount,
      { id: number; data: PatchCompanyBankAccountRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/company-bank-accounts/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CompanyBankAccount"],
    }),
    deleteCompanyBankAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/company-bank-accounts/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["CompanyBankAccount"],
    }),
  }),
});

export const {
  useGetCompanyBankAccountsQuery,
  useCreateCompanyBankAccountMutation,
  useGetCompanyBankAccountByIdQuery,
  useUpdateCompanyBankAccountMutation,
  usePatchCompanyBankAccountMutation,
  useDeleteCompanyBankAccountMutation,
} = companyBankAccountsApi;
