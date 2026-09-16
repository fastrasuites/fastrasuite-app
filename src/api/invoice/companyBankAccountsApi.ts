import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const companyBankAccountsApi = createApi({
  reducerPath: "companyBankAccountsApi",
  tagTypes: ["CompanyBankAccount"],
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
    getCompanyBankAccounts: builder.query<
      CompanyBankAccount[],
      GetCompanyBankAccountsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/company-bank-accounts/",
        params,
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
