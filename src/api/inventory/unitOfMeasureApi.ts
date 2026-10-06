import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface InventoryUnitOfMeasure {
  id?: number;
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

export interface GetInventoryUnitOfMeasureParams {
  search?: string;
  [key: string]: any;
}

export interface CreateInventoryUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

export interface UpdateInventoryUnitOfMeasureRequest {
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  [key: string]: any;
}

export const inventoryUnitOfMeasureApi = createApi({
  reducerPath: "inventoryUnitOfMeasureApi",
  tagTypes: ["InventoryUnitOfMeasure"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getInventoryUnitOfMeasures: builder.query<
      InventoryUnitOfMeasure[],
      GetInventoryUnitOfMeasureParams
    >({
      query: (params) => ({
        url: "/inventory/unit-of-measure/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["InventoryUnitOfMeasure"],
    }),
    getInventoryUnitOfMeasure: builder.query<
      InventoryUnitOfMeasure,
      number | string
    >({
      query: (id) => `/inventory/unit-of-measure/${id}/`,
      providesTags: (result, error, id) => [
        { type: "InventoryUnitOfMeasure", id },
      ],
    }),
    createInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      CreateInventoryUnitOfMeasureRequest
    >({
      query: (body) => ({
        url: "/inventory/unit-of-measure/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnitOfMeasure"],
    }),
    updateInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      { id: number | string; data: UpdateInventoryUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryUnitOfMeasure", id },
        "InventoryUnitOfMeasure",
      ],
    }),
    patchInventoryUnitOfMeasure: builder.mutation<
      InventoryUnitOfMeasure,
      { id: number | string; data: UpdateInventoryUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InventoryUnitOfMeasure", id },
        "InventoryUnitOfMeasure",
      ],
    }),
    deleteInventoryUnitOfMeasure: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/inventory/unit-of-measure/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryUnitOfMeasure"],
    }),
  }),
});

export const {
  useGetInventoryUnitOfMeasuresQuery,
  useGetInventoryUnitOfMeasureQuery,
  useCreateInventoryUnitOfMeasureMutation,
  useUpdateInventoryUnitOfMeasureMutation,
  usePatchInventoryUnitOfMeasureMutation,
  useDeleteInventoryUnitOfMeasureMutation,
} = inventoryUnitOfMeasureApi;
