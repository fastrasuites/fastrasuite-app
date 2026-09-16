import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../lib/store/store";

// Define types for nested objects
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface UserDetails {
  id: number;
  user: User;
  role: string;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  groups: string[];
}

export interface ProjectRequest {
  id: number;
  reference_id: string;
  request_type: string;
  status: "draft" | "pending" | "approved" | "rejected";
  module_destination: string;
  created_at: string;
  updated_at: string;
  project: number;
  created_by: number;
  created_by_details?: UserDetails;
}

export interface LabourRequestDetail {
  id: number;
  date_required: string;
  number_of_workers: number;
  role_type: string;
  duration: number;
  duration_unit: "days" | "weeks" | "months" | string;
  estimated_daily_rate: string;
  projected_cost: string;
  justification_notes: string;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  available_budget?: string | number;
  project_details?: {
    id: number;
    name: string;
    project_code: string;
  };
  phase_details?: {
    id: string;
    name: string;
    code?: string;
  };
  activity_details?: {
    id: string;
    name: string;
    serial_number?: number;
  };
}

export interface LabourRequest {
  id: number;
  reference_id: string;
  request_type: string;
  module_destination: string;
  status: "draft" | "pending" | "approved" | "rejected";
  created_by: number;
  created_by_details?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username?: string;
    user?: User;
  };
  created_at: string;
  updated_at: string;
  detail: LabourRequestDetail;
  project_request?: ProjectRequest;
  project?: number;
  project_details?: {
    id: number;
    name: string;
    project_code: string;
  };
  activity?: string;
}

export interface LabourRequestCreateResponse {
  date_required: string;
  number_of_workers: number;
  role_type: string;
  duration: number;
  duration_unit: "days" | "weeks" | "months" | string;
  estimated_daily_rate: string;
  justification_notes: string;
}

// Query parameter types
export interface GetLabourRequestsParams {
  status?: "draft" | "pending" | "approved" | "rejected";
  created_by?: number;
  project?: number;
  date_required?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Request body types
export interface CreateLabourRequestRequest {
  project: number;
  date_required: string;
  number_of_workers: number;
  role_type: string;
  duration: number;
  duration_unit: "days" | "weeks" | "months" | string;
  estimated_daily_rate: string;
  justification_notes?: string;
  activity?: string;
}

export interface UpdateLabourRequestRequest {
  project?: number;
  date_required?: string;
  number_of_workers?: number;
  role_type?: string;
  duration?: number;
  duration_unit?: "days" | "weeks" | "months" | string;
  estimated_daily_rate?: string;
  justification_notes?: string;
  activity?: string;
}

export interface PatchLabourRequestRequest {
  project?: number;
  date_required?: string;
  number_of_workers?: number;
  role_type?: string;
  duration?: number;
  duration_unit?: "days" | "weeks" | "months" | string;
  estimated_daily_rate?: string;
  justification_notes?: string;
  activity?: string;
}

export interface SubmitLabourRequestRequest {
  // Empty interface for submit action - no body required
  [key: string]: never;
}
export interface ApproveLabourRequest {
  status: "approved";
  approval_notes?: string;
}
export interface RejectLabourRequest {
  status: "rejected";
  rejection_notes?: string;
}
export interface CancelLabourRequest {
  status: "cancelled";
  cancellation_notes?: string;
}
// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const labourRequestApi = createApi({
  reducerPath: "labourRequestApi",
  tagTypes: ["LabourRequest"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    // Prepare headers
    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");

    // Handle both string URLs and object URLs with params
    let url: string;
    if (typeof args === "string") {
      url = `${baseUrl}${args}`;
    } else {
      // Build URL with query parameters
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
    // Labour Request Query endpoints
    getLabourRequests: builder.query<LabourRequest[], GetLabourRequestsParams>({
      query: (params) => ({
        url: "/project-requests/project-requests/?request_type=labour",
        params,
      }),
      transformResponse: (response: LabourRequest[]) => response,
      providesTags: ["LabourRequest"],
    }),
    getLabourRequest: builder.query<LabourRequest, number>({
      query: (id) => `/project-requests/project-requests/${id}/`,
      transformResponse: (response: LabourRequest | LabourRequest[]) => {
        if (Array.isArray(response)) {
          return response[0];
        }
        return response;
      },
      providesTags: (result, error, id) => [{ type: "LabourRequest", id }],
    }),

    // Labour Request Mutation endpoints
    createLabourRequest: builder.mutation<
      LabourRequestCreateResponse,
      CreateLabourRequestRequest
    >({
      query: (body) => ({
        url: "/project-requests/labour-requests/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LabourRequest"],
    }),
    updateLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data: UpdateLabourRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/labour-requests/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),
    patchLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data: PatchLabourRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/labour-requests/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),
    deleteLabourRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/labour-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),
    submitLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data?: SubmitLabourRequestRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),

    approveLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data: ApproveLabourRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/approve/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),

    rejectLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data: RejectLabourRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/reject/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),

    cancelLabourRequest: builder.mutation<
      LabourRequest,
      { id: number; data: CancelLabourRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/cancel/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "LabourRequest", id }, "LabourRequest"],
    }),
  }),
});

export const {
  useGetLabourRequestsQuery,
  useGetLabourRequestQuery,
  useCreateLabourRequestMutation,
  useUpdateLabourRequestMutation,
  usePatchLabourRequestMutation,
  useDeleteLabourRequestMutation,
  useSubmitLabourRequestMutation,
  useApproveLabourRequestMutation,
  useRejectLabourRequestMutation,
  useCancelLabourRequestMutation,
} = labourRequestApi;
