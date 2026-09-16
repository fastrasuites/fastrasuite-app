import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";

export interface Plan {
  id: number;
  name: string;
  tier: "starter" | "professional" | "enterprise" | "core";
  interval: "monthly" | "annually";
  amount: string;
  currency: string;
  description: string;
}

export interface Subscription {
  id: number;
  status: "trialing" | "active" | "past_due" | "expired" | "canceled";
  plan?: Plan | null;
  tier?: string | null;
  is_access_granted: boolean;
  trial_days_remaining?: number | null;
  days_to_renewal?: number | null;
  allowed_modules: string[];
  trial_end?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: number;
  invoice_number: string;
  tenant_name: string;
  plan: Plan;
  status: "pending" | "paid" | "overdue" | "canceled";
  is_overdue: boolean;
  amount: string;
  currency: string;
  period_start: string;
  period_end: string;
  due_date: string;
  reference?: string;
  payment_url?: string;
  paid_at?: string | null;
  notes?: string;
  created_by_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResponse {
  payment_url: string;
  reference: string;
  invoice_id: number;
  invoice_number?: string;
  amount: string;
  currency: string;
  plan_name: string;
  tier: string;
  interval: string;
}

const getTenantBaseUrl = (state: RootState) => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";

  if (!tenantSchemaName || tenantSchemaName === "public") {
    return `${protocol}://${apiDomain}`;
  }
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const SUBSCRIPTION_TAG = "Subscription" as const;
export const INVOICE_TAG = "SubscriptionInvoice" as const;
export const PLAN_TAG = "SubscriptionPlan" as const;

export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  tagTypes: [SUBSCRIPTION_TAG, INVOICE_TAG, PLAN_TAG],
  baseQuery: async (args, api) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) headers.set("authorization", `Bearer ${token}`);

    let url: string;
    let method = "GET";
    let body: any = undefined;

    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      url = `${baseUrl}${args.url}`;
      method = args.method || "GET";

      if (args.body instanceof FormData) {
        body = args.body;
      } else if (args.body) {
        headers.set("content-type", "application/json");
        body = JSON.stringify(args.body);
      }
    }

    try {
      const response = await fetch(url, { method, headers, body });

      const text = await response.text();
      let parsedData: any = null;
      try {
        parsedData = text ? JSON.parse(text) : {};
      } catch {
        parsedData = null;
      }

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: parsedData || { error: response.statusText || text },
          },
        };
      }

      if (parsedData !== null && typeof parsedData === "object") {
        return { data: parsedData };
      }

      return {
        error: {
          status: "PARSE_ERROR",
          data: { error: "Received non-JSON response from server" },
        },
      };
    } catch (error: any) {
      return {
        error: {
          status: "FETCH_ERROR",
          data: error?.message || error,
        },
      };
    }
  },

  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<Plan[], void>({
      query: () => "/subscriptions/plans/",
      providesTags: [PLAN_TAG],
    }),

    getSubscriptionStatus: builder.query<Subscription, void>({
      query: () => "/subscriptions/status/",
      providesTags: [SUBSCRIPTION_TAG],
    }),

    selfServeCheckout: builder.mutation<
      CheckoutResponse,
      { plan_id: number; callback_url?: string }
    >({
      query: (body) => ({
        url: "/subscriptions/checkout/",
        method: "POST",
        body,
      }),
      invalidatesTags: [SUBSCRIPTION_TAG, INVOICE_TAG],
    }),

    getSubscriptionInvoices: builder.query<SubscriptionInvoice[], void>({
      query: () => "/subscriptions/invoices/",
      providesTags: [INVOICE_TAG],
    }),

    getSubscriptionInvoiceDetail: builder.query<SubscriptionInvoice, number>({
      query: (id) => `/subscriptions/invoices/${id}/`,
      providesTags: (_res, _err, id) => [{ type: INVOICE_TAG, id }],
    }),

    generatePaymentLink: builder.mutation<
      { payment_url: string; reference: string; invoice: SubscriptionInvoice },
      { invoice_id: number; callback_url?: string }
    >({
      query: ({ invoice_id, callback_url }) => ({
        url: `/subscriptions/invoices/${invoice_id}/payment-link/`,
        method: "POST",
        body: { callback_url },
      }),
      invalidatesTags: [INVOICE_TAG, SUBSCRIPTION_TAG],
    }),

    verifyInvoicePayment: builder.mutation<
      SubscriptionInvoice,
      { invoice_id: number; reference: string }
    >({
      query: ({ invoice_id, reference }) => ({
        url: `/subscriptions/invoices/${invoice_id}/verify/`,
        method: "POST",
        body: { reference },
      }),
      invalidatesTags: [INVOICE_TAG, SUBSCRIPTION_TAG],
    }),

    cancelSubscription: builder.mutation<Subscription, { reason?: string }>({
      query: (body) => ({
        url: "/subscriptions/cancel/",
        method: "POST",
        body,
      }),
      invalidatesTags: [SUBSCRIPTION_TAG],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionStatusQuery,
  useSelfServeCheckoutMutation,
  useGetSubscriptionInvoicesQuery,
  useGetSubscriptionInvoiceDetailQuery,
  useGeneratePaymentLinkMutation,
  useVerifyInvoicePaymentMutation,
  useCancelSubscriptionMutation,
} = subscriptionApi;
