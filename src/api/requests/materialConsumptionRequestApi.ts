import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface MaterialConsumptionProductDetails {
  id: number;
  product_code?: string;
  product_name?: string;
  description?: string;
  standard_cost?: string | number;
  available_stock?: number;
  unit_of_measure?: number;
  unit_of_measure_details?: {
    unit_name?: string;
    unit_symbol?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MaterialConsumptionLine {
  id?: number;
  product?: number;
  product_details?: MaterialConsumptionProductDetails;
  quantity: number | string;
  quantity_released?: number | string;
  unit_of_measure?: number | string;
  unit_cost: string | number;
  total_cost: string | number;
  available_stock?: number;
  [key: string]: any;
}

export interface MaterialConsumptionRequest {
  id: number;
  request_id: string;
  status:
    | "draft"
    | "approved"
    | "pending"
    | "rejected"
    | "cancelled"
    | "released"
    | string;
  release_status?: "PENDING" | "RELEASED" | "PARTIAL" | string;
  project_request?:
    | number
    | {
        id: number;
        reference_id?: string;
        request_type?: string;
        status?: string;
        request_amount?: number;
        [key: string]: any;
      };
  project?: number;
  project_details?: {
    id: number;
    name: string;
    project_code?: string;
    [key: string]: any;
  };
  phase?: string;
  phase_details?: {
    id: string;
    name: string;
    code?: string;
    [key: string]: any;
  };
  activity?: string;
  activity_details?: {
    id: string;
    name: string;
    serial_number?: number;
    [key: string]: any;
  };
  available_budget?: string | number;
  created_by_id?: number;
  requester_details?: {
    id?: number;
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      [key: string]: any;
    };
    phone_number?: string;
    [key: string]: any;
  };
  created_by_name?: string;
  created_by_details?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  location?: string;
  location_details?: {
    id: string;
    location_code?: string;
    location_name?: string;
    location_type?: string;
    address?: string;
    [key: string]: any;
  };
  date_consumed?: string;
  notes?: string;
  lines: MaterialConsumptionLine[];
  created_at?: string;
  [key: string]: any;
}

export interface CreateMaterialConsumptionRequest {
  project: number;
  activity: string; // UUID of activity
  location: string;
  date_consumed: string;
  notes?: string;
  lines: MaterialConsumptionLine[];
}

export interface UpdateMaterialConsumptionRequest {
  project_request?: number;
  location?: string;
  date_consumed?: string;
  notes?: string;
  status?: string;
}

export interface GetMaterialConsumptionsParams {
  ordering?: string;
  search?: string;
}

export const materialConsumptionRequestApi = createApi({
  reducerPath: "materialConsumptionRequestApi",
  tagTypes: ["MaterialConsumption"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getMaterialConsumptions: builder.query<
      MaterialConsumptionRequest[],
      GetMaterialConsumptionsParams | void
    >({
      query: (params) => ({
        url: "/project-requests/material-consumption/",
        params: params || undefined,
      }),
      providesTags: ["MaterialConsumption"],
    }),
    getMaterialConsumption: builder.query<MaterialConsumptionRequest, number>({
      query: (id) => `/project-requests/material-consumption/${id}/`,
      providesTags: (result, error, id) => [
        { type: "MaterialConsumption", id },
      ],
    }),
    createMaterialConsumption: builder.mutation<
      MaterialConsumptionRequest,
      CreateMaterialConsumptionRequest
    >({
      query: (body) => ({
        url: "/project-requests/material-consumption/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialConsumption"],
    }),
    updateMaterialConsumption: builder.mutation<
      MaterialConsumptionRequest,
      { id: number; body: UpdateMaterialConsumptionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MaterialConsumption", id },
        "MaterialConsumption",
      ],
    }),
    patchMaterialConsumption: builder.mutation<
      MaterialConsumptionRequest,
      { id: number; body: UpdateMaterialConsumptionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MaterialConsumption", id },
        "MaterialConsumption",
      ],
    }),
    deleteMaterialConsumption: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "MaterialConsumption", id },
        "MaterialConsumption",
      ],
    }),

    submitMaterialConsumptionRequest: builder.mutation<
      MaterialConsumptionRequest,
      { id: number; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MaterialConsumption", id },
        "MaterialConsumption",
      ],
    }),
    releaseMaterialConsumption: builder.mutation<
      any,
      {
        id: number;
        body?: {
          location?: string;
          date_consumed?: string;
          notes?: string;
          lines?: Array<{ id: number | string; quantity_to_release: number }>;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/release/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MaterialConsumption", id },
        "MaterialConsumption",
      ],
    }),
  }),
});

export const {
  useGetMaterialConsumptionsQuery,
  useGetMaterialConsumptionQuery,
  useCreateMaterialConsumptionMutation,
  useUpdateMaterialConsumptionMutation,
  usePatchMaterialConsumptionMutation,
  useDeleteMaterialConsumptionMutation,
  useSubmitMaterialConsumptionRequestMutation,
  useReleaseMaterialConsumptionMutation,
} = materialConsumptionRequestApi;
