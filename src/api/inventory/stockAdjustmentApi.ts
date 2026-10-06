import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import type {
  StockAdjustment,
  CreateStockAdjustmentRequest,
  UpdateStockAdjustmentRequest,
  PatchStockAdjustmentRequest,
  GetStockAdjustmentsParams,
  ToggleHiddenStatusRequest,
} from "@/types/stockAdjustment";

export const stockAdjustmentApi = createApi({
  reducerPath: "stockAdjustmentApi",
  tagTypes: ["StockAdjustment", "StockLocation"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Query endpoints
    getStockAdjustments: builder.query<
      StockAdjustment[],
      GetStockAdjustmentsParams
    >({
      query: (params) => ({
        url: "/inventory/stock-adjustment/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["StockAdjustment"],
    }),

    getStockAdjustment: builder.query<StockAdjustment, string>({
      query: (id) => `/inventory/stock-adjustment/${id}/`,
      providesTags: (result, error, id) => [{ type: "StockAdjustment", id }],
    }),

    getStockAdjustmentEditable: builder.query<StockAdjustment, string>({
      query: (id) => `/inventory/stock-adjustment/${id}/check_editable/`,
      providesTags: (result, error, id) => [{ type: "StockAdjustment", id }],
    }),

    getActiveStockAdjustments: builder.query<StockAdjustment[], void>({
      query: () => "/inventory/stock-adjustment/active_list/",
      providesTags: ["StockAdjustment"],
    }),

    getDoneStockAdjustments: builder.query<StockAdjustment[], void>({
      query: () => "/inventory/stock-adjustment/done_list/",
      providesTags: ["StockAdjustment"],
    }),

    getDraftStockAdjustments: builder.query<StockAdjustment[], void>({
      query: () => "/inventory/stock-adjustment/draft_list/",
      providesTags: ["StockAdjustment"],
    }),

    getHiddenStockAdjustments: builder.query<StockAdjustment[], void>({
      query: () => "/inventory/stock-adjustment/hidden_list/",
      providesTags: ["StockAdjustment"],
    }),

    // Mutation endpoints
    createStockAdjustment: builder.mutation<
      StockAdjustment,
      CreateStockAdjustmentRequest
    >({
      query: (body) => ({
        url: "/inventory/stock-adjustment/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockAdjustment"],
    }),

    updateStockAdjustment: builder.mutation<
      StockAdjustment,
      { id: string; data: UpdateStockAdjustmentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/stock-adjustment/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "StockAdjustment",
        { type: "StockAdjustment", id },
      ],
    }),

    patchStockAdjustment: builder.mutation<
      StockAdjustment,
      { id: string; data: PatchStockAdjustmentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/stock-adjustment/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "StockAdjustment",
        { type: "StockAdjustment", id },
      ],
    }),

    deleteStockAdjustment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/stock-adjustment/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockAdjustment"],
    }),

    validateStockAdjustment: builder.mutation<
      StockAdjustment,
      { id: string; data?: UpdateStockAdjustmentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/stock-adjustment/${id}/validate/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        "StockAdjustment",
        "StockLocation",
        { type: "StockAdjustment", id },
      ],
    }),

    toggleStockAdjustmentHiddenStatus: builder.mutation<
      StockAdjustment,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/stock-adjustment/${id}/toggle_hidden_status/`,
        method: "PUT",
        body: data || {},
      }),
    }),

    patchToggleStockAdjustmentHiddenStatus: builder.mutation<
      StockAdjustment,
      { id: string; data?: ToggleHiddenStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/stock-adjustment/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data || {},
      }),
    }),
  }),
});

export const {
  // Query hooks
  useGetStockAdjustmentsQuery,
  useGetStockAdjustmentQuery,
  useGetStockAdjustmentEditableQuery,
  useGetActiveStockAdjustmentsQuery,
  useGetDoneStockAdjustmentsQuery,
  useGetDraftStockAdjustmentsQuery,
  useGetHiddenStockAdjustmentsQuery,

  // Mutation hooks
  useCreateStockAdjustmentMutation,
  useUpdateStockAdjustmentMutation,
  usePatchStockAdjustmentMutation,
  useDeleteStockAdjustmentMutation,
  useValidateStockAdjustmentMutation,
  useToggleStockAdjustmentHiddenStatusMutation,
  usePatchToggleStockAdjustmentHiddenStatusMutation,
} = stockAdjustmentApi;
