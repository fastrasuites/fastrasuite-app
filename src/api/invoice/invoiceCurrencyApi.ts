import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const invoiceCurrencyApi = createApi({
  reducerPath: "invoiceCurrencyApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getCurrencies: builder.query<Currency[], GetCurrenciesParams | void>({
      query: (params) => ({
        url: "/invoicing/currency/",
        ...(params ? { params } : {}),
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
