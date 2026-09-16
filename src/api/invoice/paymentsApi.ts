import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

export interface EmbeddedUser {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface EmbeddedUserDetails {
  url: string;
  id: number;
  user: EmbeddedUser;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
}

export type PaymentStatus = "pending" | "confirmed" | "failed" | string;

export interface MakePaymentRequest {
  amount_paid: string;
  reference_id: string;
  payment_method: string;
  notes?: string;
}

export interface MakePaymentResponse {
  amount_paid: string;
  reference_id: string;
  payment_method: string;
  notes: string;
}

export interface DisbursementRequest {
  source_type: "PETTY_CASH" | string;
  petty_cash_request: number;
  company_bank_account: number;
  notes?: string;
}

export interface PaymentHistory {
  created_by: number;
  updated_by: number;
  date_created: string;
  date_updated: string;
  is_hidden: boolean;
  created_by_details: EmbeddedUserDetails;
  updated_by_details: EmbeddedUserDetails;
  id: number;
  invoice: string;
  invoice_details: any; // Using any for brevity here, or import the full Invoice type if preferred
  amount_paid: string;
  balance_remaining: string;
  payment_method: string;
  status: PaymentStatus;
  notes: string;
}

export interface GetPaymentHistoryParams {
  date_created?: string;
  ordering?: string;
  payment_method?: string;
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

export const paymentsApi = createApi({
  reducerPath: "paymentsApi",
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
    makePayment: builder.mutation<MakePaymentResponse, MakePaymentRequest>({
      query: (body) => ({
        url: "/invoicing/make-payment/",
        method: "POST",
        body,
      }),
    }),
    makeDisbursement: builder.mutation<any, DisbursementRequest>({
      query: (body) => ({
        url: "/invoicing/disbursement/",
        method: "POST",
        body,
      }),
    }),
    getPaymentHistory: builder.query<
      PaymentHistory[],
      GetPaymentHistoryParams | void
    >({
      query: (params) => ({
        url: "/invoicing/payment-history/",
        params,
      }),
    }),
    getPaymentHistoryById: builder.query<PaymentHistory, number>({
      query: (id) => `/invoicing/payment-history/${id}/`,
    }),
  }),
});

export const {
  useMakePaymentMutation,
  useMakeDisbursementMutation,
  useGetPaymentHistoryQuery,
  useGetPaymentHistoryByIdQuery,
} = paymentsApi;
