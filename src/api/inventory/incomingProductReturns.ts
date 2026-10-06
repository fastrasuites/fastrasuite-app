import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

import type { IncomingProductReturn } from "../../types/incomingProductReturn";

export const incomingProductReturnsApi = createApi({
  reducerPath: "incomingProductReturnsApi",
  tagTypes: ["IncomingProductReturn"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getIncomingProductReturns: builder.query<IncomingProductReturn[], any>({
      query: (params) => ({
        url: "/inventory/return-incoming-product/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["IncomingProductReturn"],
    }),

    getIncomingProductReturn: builder.query<IncomingProductReturn, string>({
      query: (id) => `/inventory/return-incoming-product/${id}/`,
      providesTags: (result, error, id) => [
        { type: "IncomingProductReturn", id },
      ],
    }),

    createIncomingProductReturn: builder.mutation<IncomingProductReturn, any>({
      query: (formData) => ({
        url: "/inventory/return-incoming-product/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["IncomingProductReturn"],
    }),

    confirmIncomingProductReturn: builder.mutation<
      IncomingProductReturn,
      string
    >({
      query: (id) => ({
        url: `/inventory/return-incoming-product/${id}/confirm-return/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "IncomingProductReturn", id },
        "IncomingProductReturn",
      ],
    }),

    cancelIncomingProductReturn: builder.mutation<
      IncomingProductReturn,
      string
    >({
      query: (id) => ({
        url: `/inventory/return-incoming-product/${id}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "IncomingProductReturn", id },
        "IncomingProductReturn",
      ],
    }),
  }),
});

export const {
  useGetIncomingProductReturnsQuery,
  useGetIncomingProductReturnQuery,
  useCreateIncomingProductReturnMutation,
  useConfirmIncomingProductReturnMutation,
  useCancelIncomingProductReturnMutation,
} = incomingProductReturnsApi;
