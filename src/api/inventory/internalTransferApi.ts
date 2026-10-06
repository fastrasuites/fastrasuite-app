import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export const internalTransferApi = createApi({
  reducerPath: "internalTransferApi",
  tagTypes: ["InternalTransfer"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getInternalTransfers: builder.query<any[], any>({
      query: (params) => ({
        url: "/inventory/internal-transfer/",
        ...(params ? { params } : {}),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "InternalTransfer" as const,
                id,
              })),
              { type: "InternalTransfer", id: "LIST" },
            ]
          : [{ type: "InternalTransfer", id: "LIST" }],
    }),

    getInternalTransfer: builder.query<any, string>({
      query: (id) => `/inventory/internal-transfer/${id}/`,
    }),

    getActiveInternalTransfers: builder.query<any[], void>({
      query: () => "/inventory/internal-transfer/active_list/",
    }),

    getHiddenInternalTransfers: builder.query<any[], void>({
      query: () => "/inventory/internal-transfer/hidden_list/",
    }),

    // Mutation endpoints
    createInternalTransfer: builder.mutation<any, any>({
      query: (body) => ({
        url: "/inventory/internal-transfer/",
        method: "POST",
        body,
      }),
    }),

    updateInternalTransfer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InternalTransfer", id },
      ],
    }),

    patchInternalTransfer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/`,
        method: "PATCH",
        body: data,
      }),
    }),

    deleteInternalTransfer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/internal-transfer/${id}/soft_delete/`,
        method: "DELETE",
      }),
    }),

    toggleInternalTransferHiddenStatus: builder.mutation<
      any,
      { id: string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/internal-transfer/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetInternalTransfersQuery,
  useGetInternalTransferQuery,
  useGetActiveInternalTransfersQuery,
  useGetHiddenInternalTransfersQuery,

  // Mutation hooks
  useCreateInternalTransferMutation,
  useUpdateInternalTransferMutation,
  usePatchInternalTransferMutation,
  useDeleteInternalTransferMutation,
  useToggleInternalTransferHiddenStatusMutation,
} = internalTransferApi;
