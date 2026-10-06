import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

// Reuse CurrencyDetails interface from purchaseRequestApi
export interface CurrencyDetails {
  url: string;
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  created_on: string;
  is_hidden: boolean;
}

// Define alias for backward compatibility and cleaner naming
export type Currency = CurrencyDetails;

// Define query parameter types
export interface GetCurrenciesParams {
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

// Define request body types
export interface CreateCurrencyRequest {
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  is_hidden?: boolean;
}

export interface UpdateCurrencyRequest {
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  is_hidden?: boolean;
}

export interface PatchCurrencyRequest {
  currency_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  is_hidden?: boolean;
}

export const currencyApi = createApi({
  reducerPath: "currencyApi",
  tagTypes: ["Currency"] as const,
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getCurrencies: builder.query<Currency[], GetCurrenciesParams>({
      query: (params) => ({
        url: "/purchase/currency/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["Currency"],
    }),
    getCurrency: builder.query<Currency, number>({
      query: (id) => `/purchase/currency/${id}/`,
      providesTags: (result, error, id) => [{ type: "Currency", id }],
    }),

    // Mutation endpoints
    createCurrency: builder.mutation<Currency, CreateCurrencyRequest>({
      query: (body) => ({
        url: "/purchase/currency/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Currency"],
    }),
    updateCurrency: builder.mutation<
      Currency,
      { id: number; data: UpdateCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/currency/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Currency", id },
        "Currency",
      ],
    }),
    patchCurrency: builder.mutation<
      Currency,
      { id: number; data: PatchCurrencyRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/currency/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Currency", id },
        "Currency",
      ],
    }),
    deleteCurrency: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/currency/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Currency", id },
        "Currency",
      ],
    }),
  }),
});

export const {
  // Query hooks
  useGetCurrenciesQuery,
  useGetCurrencyQuery,

  // Mutation hooks
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  usePatchCurrencyMutation,
  useDeleteCurrencyMutation,
} = currencyApi;
