import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface AccountingSettings {
  id: number;
  accounts_payable: number;
  inventory_account: number;
  default_expense_account: number;
  bank_account: number;
  can_pay_without_receiving: boolean;
}

export interface CreateAccountingSettingsRequest {
  accounts_payable: number;
  inventory_account: number;
  default_expense_account: number;
  bank_account: number;
  can_pay_without_receiving: boolean;
}

export interface GetAccountingSettingsParams {
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

export const accountingSettingsApi = createApi({
  reducerPath: "accountingSettingsApi",
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
    getAccountingSettings: builder.query<
      AccountingSettings[],
      GetAccountingSettingsParams | void
    >({
      query: (params) => ({
        url: "/invoicing/accounting-settings/",
        params,
      }),
    }),
    createAccountingSettings: builder.mutation<
      AccountingSettings,
      CreateAccountingSettingsRequest
    >({
      query: (body) => ({
        url: "/invoicing/accounting-settings/",
        method: "POST",
        body,
      }),
    }),
    getAccountingSettingsById: builder.query<AccountingSettings, number>({
      query: (id) => `/invoicing/accounting-settings/${id}/`,
    }),
    updateAccountingSettings: builder.mutation<
      AccountingSettings,
      { id: number; data: CreateAccountingSettingsRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/accounting-settings/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchAccountingSettings: builder.mutation<
      AccountingSettings,
      { id: number; data: Partial<CreateAccountingSettingsRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/accounting-settings/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteAccountingSettings: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/accounting-settings/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetAccountingSettingsQuery,
  useCreateAccountingSettingsMutation,
  useGetAccountingSettingsByIdQuery,
  useUpdateAccountingSettingsMutation,
  usePatchAccountingSettingsMutation,
  useDeleteAccountingSettingsMutation,
} = accountingSettingsApi;
