import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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

// Helper to resolve the tenant schema name API base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const plantEquipmentRequestApi = createApi({
  reducerPath: "plantEquipmentRequestApi",
  tagTypes: ["PlantEquipmentRequest"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers with Authorization token
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      // Build search params
      const params = new URLSearchParams();
      if (args.params) {
        Object.entries(args.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      url = `${baseUrl}${args.url}${queryString ? `?${queryString}` : ""}`;
    }

    try {
      const response = await fetch(url, {
        method: typeof args === "string" ? "GET" : args.method || "GET",
        headers,
        body:
          typeof args === "string"
            ? undefined
            : args.body
            ? JSON.stringify(args.body)
            : undefined,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json(),
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          status: "FETCH_ERROR" as const,
          data: error,
        },
      };
    }
  },
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
      providesTags: (result, error, id) => [{ type: "PlantEquipmentRequest", id }],
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
      invalidatesTags: (result, error, { id }) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
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
      invalidatesTags: (result, error, { id }) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
    }),
    deletePlantEquipmentRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
    }),
    softDeletePlantEquipmentRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/plant-equipment/${id}/soft_delete/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
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
      invalidatesTags: (result, error, { id }) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
    }),
    getActivePlantEquipmentRequests: builder.query<PlantEquipmentRequest[], void>({
      query: () => "/project-requests/plant-equipment/active_list/",
      providesTags: ["PlantEquipmentRequest"],
    }),
    getHiddenPlantEquipmentRequests: builder.query<PlantEquipmentRequest[], void>({
      query: () => "/project-requests/plant-equipment/hidden_list/",
      providesTags: ["PlantEquipmentRequest"],
    }),
    submitPlantEquipmentRequest: builder.mutation<PlantEquipmentRequest, { id: number; data?: any }>({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "PlantEquipmentRequest", id }, "PlantEquipmentRequest"],
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
