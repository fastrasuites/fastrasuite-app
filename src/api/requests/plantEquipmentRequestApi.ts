import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface PlantEquipmentRequest {
  id: number;
  reference_id: string;
  equipment_name: string;
  description: string;
  quantity: number;
  required_date: string;
  estimated_cost: string; // Decimal string e.g. "60000.00"
  justification_notes: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  project_request: number;
}

export interface CreatePlantEquipmentRequest {
  reference_id?: string;
  equipment_name: string;
  description?: string;
  quantity: number;
  required_date: string;
  estimated_cost: string;
  justification_notes?: string;
  is_hidden?: boolean;
  project_request: number;
}

export interface GetPlantEquipmentParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export const plantEquipmentRequestApi = createApi({
  reducerPath: "plantEquipmentRequestApi",
  tagTypes: ["PlantEquipmentRequest"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getPlantEquipmentRequests: builder.query<
      PlantEquipmentRequest[],
      GetPlantEquipmentParams | void
    >({
      query: (params) => ({
        url: "/project-requests/plant-equipment/",
        params: params || undefined,
      }),
      providesTags: ["PlantEquipmentRequest"],
    }),
    getPlantEquipmentRequest: builder.query<PlantEquipmentRequest, number>({
      query: (id) => `/project-requests/plant-equipment/${id}/`,
      providesTags: (result, error, id) => [
        { type: "PlantEquipmentRequest", id },
      ],
    }),
    createPlantEquipmentRequest: builder.mutation<
      PlantEquipmentRequest,
      CreatePlantEquipmentRequest
    >({
      query: (body) => ({
        url: "/project-requests/plant-equipment/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PlantEquipmentRequest"],
    }),
    updatePlantEquipmentRequest: builder.mutation<
      PlantEquipmentRequest,
      { id: number; data: Partial<CreatePlantEquipmentRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/plant-equipment/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
    patchPlantEquipmentRequest: builder.mutation<
      PlantEquipmentRequest,
      { id: number; data: Partial<CreatePlantEquipmentRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/plant-equipment/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
    deletePlantEquipmentRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
    softDeletePlantEquipmentRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/plant-equipment/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
    toggleHiddenStatus: builder.mutation<
      PlantEquipmentRequest,
      { id: number; data: Partial<CreatePlantEquipmentRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/plant-equipment/${id}/toggle_hidden_status/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
    getActivePlantEquipmentRequests: builder.query<
      PlantEquipmentRequest[],
      void
    >({
      query: () => "/project-requests/plant-equipment/active_list/",
      providesTags: ["PlantEquipmentRequest"],
    }),
    getHiddenPlantEquipmentRequests: builder.query<
      PlantEquipmentRequest[],
      void
    >({
      query: () => "/project-requests/plant-equipment/hidden_list/",
      providesTags: ["PlantEquipmentRequest"],
    }),
    submitPlantEquipmentRequest: builder.mutation<
      PlantEquipmentRequest,
      { id: number; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PlantEquipmentRequest", id },
        "PlantEquipmentRequest",
      ],
    }),
  }),
});

export const {
  useGetPlantEquipmentRequestsQuery,
  useGetPlantEquipmentRequestQuery,
  useCreatePlantEquipmentRequestMutation,
  useUpdatePlantEquipmentRequestMutation,
  usePatchPlantEquipmentRequestMutation,
  useDeletePlantEquipmentRequestMutation,
  useSoftDeletePlantEquipmentRequestMutation,
  useToggleHiddenStatusMutation,
  useGetActivePlantEquipmentRequestsQuery,
  useGetHiddenPlantEquipmentRequestsQuery,
  useSubmitPlantEquipmentRequestMutation,
} = plantEquipmentRequestApi;
