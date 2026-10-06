import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export interface ProjectRequest {
  id: number;
  reference_id: string;
  request_type:
    | "labour"
    | "purchase"
    | "petty_cash"
    | "subcontractor"
    | "plant_equipment"
    | string;
  module_destination: string;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  created_by: number;
  created_at: string;
  updated_at: string;
  detail: any; // Can be parsed JSON or string
  project?: number;
  project_details?: {
    id: number;
    name: string;
    code: string;
  };
  created_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface GetProjectRequestsParams {
  ordering?: string;
  project?: number;
  request_type?: string;
  search?: string;
  status?: string;
  module_destination?: string;
}

export interface ApproveProjectRequest {
  status?: "approved";
  approval_notes?: string;
}

export interface RejectProjectRequest {
  status?: "rejected";
  rejection_notes?: string;
}

export interface CancelProjectRequest {
  status?: "cancelled";
  cancellation_notes?: string;
}

export interface SiteLocationOption {
  id?: string | number;
  name?: string;
}

export interface ProjectOption {
  id: number;
  project_code: string;
  name: string;
  site_location?: SiteLocationOption | string | number | null;
}

export interface PhaseOption {
  id: string;
  name: string;
  code: string;
  sequence?: number;
  original_amount?: number;
  approved_adjustment?: number;
  current_budget?: number;
}

export interface ActivityOption {
  id: string;
  serial_number?: number;
  name: string;
  original_amount?: number;
  approved_adjustment?: number;
  current_budget?: number;
  committed?: number;
  actual_spent?: number;
  available_budget?: number;
}

export interface GetPhaseOptionsParams {
  project_id: number;
}

export interface GetActivityOptionsParams {
  project_id: number;
  phase_id: string;
}

export const projectRequestApi = createApi({
  reducerPath: "projectRequestApi",
  tagTypes: ["ProjectRequest"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getProjectRequests: builder.query<
      ProjectRequest[],
      GetProjectRequestsParams | void
    >({
      query: (params) => ({
        url: "/project-requests/project-requests/",
        params: params || undefined,
      }),
      providesTags: (result) => {
        const list = Array.isArray(result)
          ? result
          : (result as any)?.results && Array.isArray((result as any).results)
            ? (result as any).results
            : [];
        return [
          ...list.map(({ id }: { id: any }) => ({
            type: "ProjectRequest" as const,
            id,
          })),
          { type: "ProjectRequest", id: "LIST" },
          "ProjectRequest",
        ];
      },
    }),
    getProjectRequest: builder.query<ProjectRequest, number>({
      query: (id) => `/project-requests/project-requests/${id}/`,
      providesTags: (result, error, id) => [
        { type: "ProjectRequest", id },
        "ProjectRequest",
      ],
    }),
    approveProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data?: ApproveProjectRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/approve/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    rejectProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data?: RejectProjectRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/reject/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    cancelProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data?: CancelProjectRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/cancel/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    submitProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    updateProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    patchProjectRequest: builder.mutation<
      ProjectRequest,
      { id: number; data: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    deleteProjectRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ProjectRequest", id },
        { type: "ProjectRequest", id: "LIST" },
        "ProjectRequest",
      ],
    }),
    getProjectOptions: builder.query<ProjectOption[], void>({
      query: () => "/project-requests/project-requests/project-options/",
    }),
    getPhaseOptions: builder.query<PhaseOption[], GetPhaseOptionsParams>({
      query: (params) => ({
        url: "/project-requests/project-requests/phase-options/",
        params,
      }),
    }),
    getActivityOptions: builder.query<
      ActivityOption[],
      GetActivityOptionsParams
    >({
      query: (params) => ({
        url: "/project-requests/project-requests/activity-options/",
        params,
      }),
    }),
    getProjectRequestProducts: builder.query<any[], void | { search?: string }>(
      {
        query: (params) => ({
          url: "/project-requests/project-requests/products/",
          params: params || undefined,
        }),
      },
    ),
  }),
});

export const {
  useGetProjectRequestsQuery,
  useGetProjectRequestQuery,
  useApproveProjectRequestMutation,
  useRejectProjectRequestMutation,
  useCancelProjectRequestMutation,
  useSubmitProjectRequestMutation,
  useUpdateProjectRequestMutation,
  usePatchProjectRequestMutation,
  useDeleteProjectRequestMutation,
  useGetProjectOptionsQuery,
  useGetPhaseOptionsQuery,
  useGetActivityOptionsQuery,
  useGetProjectRequestProductsQuery,
} = projectRequestApi;
