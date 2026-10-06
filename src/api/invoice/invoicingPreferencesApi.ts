import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const invoicingPreferencesApi = createApi({
  reducerPath: "invoicingPreferencesApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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
