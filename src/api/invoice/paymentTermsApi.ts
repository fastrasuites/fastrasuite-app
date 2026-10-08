import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

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

export const paymentTermsApi = createApi({
  reducerPath: "paymentTermsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPaymentTerms: builder.query<PaymentTerm[], GetPaymentTermsParams | void>(
      {
        query: (params) => ({
          url: "/invoicing/payment-term/",
          ...(params ? { params } : {}),
        }),
      },
    ),
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
