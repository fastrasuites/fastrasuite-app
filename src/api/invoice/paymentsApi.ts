import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const paymentsApi = createApi({
  reducerPath: "paymentsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
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
        ...(params ? { params } : {}),
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
