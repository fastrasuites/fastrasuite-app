import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const currencyApi = createApi({
  reducerPath: "currencyApi",
  tagTypes: ["Currency"] as const,
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    // Handle both string URLs and object URLs with params
    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      // Build URL with query parameters
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
    // Query endpoints
    getCurrencies: builder.query<Currency[], GetCurrenciesParams>({
      query: (params) => ({
        url: "/purchase/currency/",
        params,
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
