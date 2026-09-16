import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export type InvoicingMethod = "ordered_quantity" | "delivered_quantity";

export interface InvoicingPreferences {
  id: number;
  default_invoicing_method: InvoicingMethod;
  default_payment_term: number | null;
}

export interface SetInvoicingPreferencesRequest {
  default_invoicing_method: InvoicingMethod;
  default_payment_term?: number | null;
}

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const invoicingPreferencesApi = createApi({
  reducerPath: "invoicingPreferencesApi",
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
    getInvoicingPreferences: builder.query<InvoicingPreferences, void>({
      query: () => "/invoicing/invoicing-preferences/details/",
    }),
    setInvoicingPreferences: builder.mutation<
      InvoicingPreferences,
      SetInvoicingPreferencesRequest
    >({
      query: (body) => ({
        url: "/invoicing/invoicing-preferences/set-defaults/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetInvoicingPreferencesQuery,
  useSetInvoicingPreferencesMutation,
} = invoicingPreferencesApi;
