import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

// Define types for requests and responses
export interface UnitOfMeasure {
  id?: number;
  url: string;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  created_on: string;
  is_hidden: boolean;
}

export interface GetUnitOfMeasureParams {
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_hidden?: boolean;
}

export interface UpdateUnitOfMeasureRequest {
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
  is_hidden?: boolean;
}

export interface PatchUnitOfMeasureRequest {
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
  is_hidden?: boolean;
}

export const unitOfMeasureApi = createApi({
  reducerPath: "unitOfMeasureApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  tagTypes: ["UnitOfMeasure"],
  endpoints: (builder) => ({
    // Query endpoints
    getUnitOfMeasures: builder.query<UnitOfMeasure[], GetUnitOfMeasureParams>({
      query: (params) => ({
        url: "/purchase/unit-of-measure/",
        ...(params ? { params } : {}),
      }),
      providesTags: ["UnitOfMeasure"],
    }),
    getUnitOfMeasure: builder.query<UnitOfMeasure, number>({
      query: (id) => `/purchase/unit-of-measure/${id}/`,
      providesTags: (result, error, id) => [{ type: "UnitOfMeasure", id }],
    }),

    // Mutation endpoints
    createUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      CreateUnitOfMeasureRequest
    >({
      query: (body) => ({
        url: "/purchase/unit-of-measure/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UnitOfMeasure"],
    }),
    updateUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      { id: number; data: UpdateUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
    patchUnitOfMeasure: builder.mutation<
      UnitOfMeasure,
      { id: number; data: PatchUnitOfMeasureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
    deleteUnitOfMeasure: builder.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/unit-of-measure/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "UnitOfMeasure", id },
        "UnitOfMeasure",
      ],
    }),
  }),
});

export const {
  useGetUnitOfMeasuresQuery,
  useGetUnitOfMeasureQuery,
  useCreateUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
  usePatchUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
} = unitOfMeasureApi;
