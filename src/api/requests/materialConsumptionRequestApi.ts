import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

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
  status: "draft" | "approved" | "pending" | "rejected" | "cancelled" | "released" | string;
  release_status?: "PENDING" | "RELEASED" | "PARTIAL" | string;
  project_request?: number | {
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

const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const materialConsumptionRequestApi = createApi({
  reducerPath: "materialConsumptionRequestApi",
  tagTypes: ["MaterialConsumption"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
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
        body: typeof args === "string" ? undefined : args.body ? JSON.stringify(args.body) : undefined,
      });

      if (response.status === 204) {
        return { data: undefined };
      }

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
    getMaterialConsumptions: builder.query<MaterialConsumptionRequest[], GetMaterialConsumptionsParams | void>({
      query: (params) => ({
        url: "/project-requests/material-consumption/",
        params: params || undefined,
      }),
      providesTags: ["MaterialConsumption"],
    }),
    getMaterialConsumption: builder.query<MaterialConsumptionRequest, number>({
      query: (id) => `/project-requests/material-consumption/${id}/`,
      providesTags: (result, error, id) => [{ type: "MaterialConsumption", id }],
    }),
    createMaterialConsumption: builder.mutation<MaterialConsumptionRequest, CreateMaterialConsumptionRequest>({
      query: (body) => ({
        url: "/project-requests/material-consumption/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaterialConsumption"],
    }),
    updateMaterialConsumption: builder.mutation<MaterialConsumptionRequest, { id: number; body: UpdateMaterialConsumptionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "MaterialConsumption", id }, "MaterialConsumption"],
    }),
    patchMaterialConsumption: builder.mutation<MaterialConsumptionRequest, { id: number; body: UpdateMaterialConsumptionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "MaterialConsumption", id }, "MaterialConsumption"],
    }),
    deleteMaterialConsumption: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "MaterialConsumption", id }, "MaterialConsumption"],
    }),

    submitMaterialConsumptionRequest: builder.mutation<MaterialConsumptionRequest, { id: number; data?: any }>({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "MaterialConsumption", id }, "MaterialConsumption"],
    }),
    releaseMaterialConsumption: builder.mutation<any, { id: number; body?: { location?: string; date_consumed?: string; notes?: string; lines?: Array<{ id: number | string; quantity_to_release: number }> } }>({
      query: ({ id, body }) => ({
        url: `/project-requests/material-consumption/${id}/release/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "MaterialConsumption", id }, "MaterialConsumption"],
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
