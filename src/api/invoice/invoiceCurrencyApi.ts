import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface Currency {
  url: string;
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  created_on: string;
  is_hidden: boolean;
}

export interface CreateCurrencyRequest {
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  is_hidden: boolean;
}

export interface UpdateCurrencyRequest extends CreateCurrencyRequest {}

export interface PatchCurrencyRequest extends Partial<CreateCurrencyRequest> {}

export interface GetCurrenciesParams {
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

export const invoiceCurrencyApi = createApi({
  reducerPath: "invoiceCurrencyApi",
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
    getCurrencies: builder.query<Currency[], GetCurrenciesParams | void>({
      query: (params) => ({
        url: "/invoicing/currency/",
        params,
      }),
    }),
    createCurrency: builder.mutation<Currency, CreateCurrencyRequest>({
      query: (body) => ({
        url: "/invoicing/currency/",
        method: "POST",
        body,
      }),
    }),
    getCurrencyById: builder.query<Currency, number>({
      query: (id) => `/invoicing/currency/${id}/`,
    }),
    updateCurrency: builder.mutation<
      Currency,
      { id: number; data: UpdateCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/currency/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchCurrency: builder.mutation<
      Currency,
      { id: number; data: PatchCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/currency/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteCurrency: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/currency/${id}/`,
        method: "DELETE",
      }),
    }),
    softDeleteCurrency: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/currency/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),
    toggleCurrencyHiddenStatus: builder.mutation<
      Currency,
      { id: number; data: UpdateCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/currency/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchToggleCurrencyHiddenStatus: builder.mutation<
      Currency,
      { id: number; data: PatchCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/currency/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data,
      }),
    }),
    getActiveCurrencies: builder.query<Currency[], void>({
      query: () => "/invoicing/currency/active_list/",
    }),
    getHiddenCurrencies: builder.query<Currency[], void>({
      query: () => "/invoicing/currency/hidden_list/",
    }),
  }),
});

export const {
  useGetCurrenciesQuery,
  useCreateCurrencyMutation,
  useGetCurrencyByIdQuery,
  useUpdateCurrencyMutation,
  usePatchCurrencyMutation,
  useDeleteCurrencyMutation,
  useSoftDeleteCurrencyMutation,
  useToggleCurrencyHiddenStatusMutation,
  usePatchToggleCurrencyHiddenStatusMutation,
  useGetActiveCurrenciesQuery,
  useGetHiddenCurrenciesQuery,
} = invoiceCurrencyApi;
