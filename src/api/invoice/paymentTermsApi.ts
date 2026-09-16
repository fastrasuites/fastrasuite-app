import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface PaymentTerm {
  id: number;
  name: string;
  description: string;
  days_until_due: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentTermRequest {
  name: string;
  description: string;
  days_until_due: number;
  is_active: boolean;
}

export interface UpdatePaymentTermRequest extends CreatePaymentTermRequest {}

export interface PatchPaymentTermRequest extends Partial<CreatePaymentTermRequest> {}

export interface GetPaymentTermsParams {
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

export const paymentTermsApi = createApi({
  reducerPath: "paymentTermsApi",
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
    getPaymentTerms: builder.query<PaymentTerm[], GetPaymentTermsParams | void>({
      query: (params) => ({
        url: "/invoicing/payment-term/",
        params,
      }),
    }),
    createPaymentTerm: builder.mutation<PaymentTerm, CreatePaymentTermRequest>({
      query: (body) => ({
        url: "/invoicing/payment-term/",
        method: "POST",
        body,
      }),
    }),
    getPaymentTermById: builder.query<PaymentTerm, number>({
      query: (id) => `/invoicing/payment-term/${id}/`,
    }),
    updatePaymentTerm: builder.mutation<
      PaymentTerm,
      { id: number; data: UpdatePaymentTermRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/payment-term/${id}/`,
        method: "PUT",
        body: data,
      }),
    }),
    patchPaymentTerm: builder.mutation<
      PaymentTerm,
      { id: number; data: PatchPaymentTermRequest }
    >({
      query: ({ id, data }) => ({
        url: `/invoicing/payment-term/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),
    deletePaymentTerm: builder.mutation<void, number>({
      query: (id) => ({
        url: `/invoicing/payment-term/${id}/`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetPaymentTermsQuery,
  useCreatePaymentTermMutation,
  useGetPaymentTermByIdQuery,
  useUpdatePaymentTermMutation,
  usePatchPaymentTermMutation,
  useDeletePaymentTermMutation,
} = paymentTermsApi;
