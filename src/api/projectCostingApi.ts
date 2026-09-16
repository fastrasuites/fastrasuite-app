import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type {
  ProjectCostingFilterParams,
  ProjectCostingProject,
  CreateProjectCostingProjectRequest,
  UpdateProjectCostingProjectRequest,
  CreateAddPhaseActivityRequest,
  UpdatePhaseBundleRequest,
  DeletePhaseRequest,
  CreateActualCostRequest,
  CreateBudgetAdjustmentRequest,
  CreateCommitmentRequest,
  ProjectActionRequest,
  BudgetAdjustment,
  ProjectTransaction,
  Activity,
  Phase,
} from "@/types/projectCosting";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol = (apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")) ? "http" : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const projectCostingApi = createApi({
  reducerPath: "projectCostingApi",
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    
    // Do not set content-type if the body is FormData (for file uploads)
    if (args && (args as any).body && (args as any).body instanceof FormData) {
      // Browser will set the correct multipart/form-data boundary
    } else {
      headers.set("content-type", "application/json");
    }
    headers.set("accept", "application/json");

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
      const isStringArgs = typeof args === "string";
      const body = !isStringArgs && args.body 
        ? (args.body instanceof FormData ? args.body : JSON.stringify(args.body)) 
        : undefined;

      const response = await fetch(url, {
        method: isStringArgs ? "GET" : args.method || "GET",
        headers,
        body,
      });

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: await response.json().catch(() => ({})),
          },
        };
      }

      if (response.status === 204) {
        return { data: null };
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
  tagTypes: ["ProjectCosting", "BudgetAdjustments"],
  endpoints: (builder) => ({
    // Projects Core Endpoints
    getProjectCostingProjects: builder.query<ProjectCostingProject[], ProjectCostingFilterParams>({
      query: (params) => ({
        url: "/project-costing/projects/",
        params,
      }),
      providesTags: ["ProjectCosting"],
    }),
    getProjectCostingProject: builder.query<ProjectCostingProject, number>({
      query: (id) => `/project-costing/projects/${id}/`,
      providesTags: (result, error, id) => [{ type: "ProjectCosting", id }],
    }),
    createProjectCostingProject: builder.mutation<ProjectCostingProject, CreateProjectCostingProjectRequest>({
      query: (body) => ({
        url: "/project-costing/projects/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectCosting"],
    }),
    createPendingProjectCostingProject: builder.mutation<ProjectCostingProject, CreateProjectCostingProjectRequest>({
      query: (body) => ({
        url: "/project-costing/projects/create-pending/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectCosting"],
    }),
    updateProjectCostingProject: builder.mutation<ProjectCostingProject, { id: number; body: UpdateProjectCostingProjectRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/`,
        method: "PUT",
        body,
      }),
    }),
    patchProjectCostingProject: builder.mutation<ProjectCostingProject, { id: number; body: Partial<UpdateProjectCostingProjectRequest> }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/`,
        method: "PATCH",
        body,
      }),
    }),
    deleteProjectCostingProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-costing/projects/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectCosting"],
    }),

    // Project Actions
    approveProject: builder.mutation<ProjectCostingProject, { id: number; body?: ProjectActionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/approve/`,
        method: "POST",
        body,
      }),
    }),
    closeProject: builder.mutation<ProjectCostingProject, { id: number; body?: ProjectActionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/close/`,
        method: "POST",
        body,
      }),
    }),
    rejectProject: builder.mutation<ProjectCostingProject, { id: number; body?: ProjectActionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/reject/`,
        method: "POST",
        body,
      }),
    }),
    submitProject: builder.mutation<ProjectCostingProject, { id: number; body?: ProjectActionRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/submit/`,
        method: "POST",
        body,
      }),
    }),
    addProjectDocument: builder.mutation<ProjectCostingProject, { id: number; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/add_document/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProjectCosting", id }],
    }),

    // Phase & Activity Management
    createAddPhaseActivity: builder.mutation<{ phase_id: number; activities: Activity[] }, { id: number; body: CreateAddPhaseActivityRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/createAdd_phase_activity/`,
        method: "POST",
        body,
      }),
    }),
    deletePhase: builder.mutation<void, { id: number; body: DeletePhaseRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/delete_phase/`,
        method: "DELETE",
        body,
      }),
    }),
    updatePhaseBundle: builder.mutation<{ updated: Activity[]; created: Activity[] }, { id: number; body: UpdatePhaseBundleRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/update_phase_bundle/`,
        method: "PATCH",
        body,
      }),
    }),

    // Budget Adjustments
    approveBudgetAdjustment: builder.mutation<ProjectCostingProject, { id: number; adjustment_id?: string; body?: any }>({
      query: ({ id, adjustment_id, body }) => ({
        url: `/project-costing/projects/${id}/approve_budget_adjustment/`,
        method: "POST",
        params: { adjustment_id: adjustment_id || body?.adjustment_id || body?.uuid || body?.id },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectCosting", id },
        { type: "BudgetAdjustments", id },
      ],
    }),
    createBudgetAdjustment: builder.mutation<ProjectCostingProject, { id: number; body: CreateBudgetAdjustmentRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/create_budget_adjustment/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectCosting", id },
        { type: "BudgetAdjustments", id },
      ],
    }),
    rejectBudgetAdjustment: builder.mutation<ProjectCostingProject, { id: number; adjustment_id?: string; body?: any }>({
      query: ({ id, adjustment_id, body }) => ({
        url: `/project-costing/projects/${id}/reject_budget_adjustment/`,
        method: "POST",
        params: { adjustment_id: adjustment_id || body?.adjustment_id || body?.uuid || body?.id },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectCosting", id },
        { type: "BudgetAdjustments", id },
      ],
    }),
    submitBudgetAdjustment: builder.mutation<ProjectCostingProject, { id: number; adjustment_id?: string; body?: any }>({
      query: ({ id, adjustment_id, body }) => ({
        url: `/project-costing/projects/${id}/submit_budget_adjustment/`,
        method: "POST",
        params: { adjustment_id: adjustment_id || body?.adjustment_id || body?.uuid || body?.id },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectCosting", id },
        { type: "BudgetAdjustments", id },
      ],
    }),
    getBudgetAdjustments: builder.query<BudgetAdjustment[], number>({
      query: (id) => `/project-costing/projects/${id}/budget_adjustments/`,
      providesTags: (result, error, id) => [{ type: "BudgetAdjustments", id }],
    }),
    // Project Settings
    getProjectSettings: builder.query<any, number>({
      query: (id) => `/project-costing/projects/${id}/project_settings/`,
      providesTags: (result, error, id) => [{ type: "ProjectCosting", id }],
    }),
    updateProjectSettings: builder.mutation<any, { id: number; body: { allow_budget_decrease?: boolean; [key: string]: any } }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/project_settings/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProjectCosting", id }],
    }),

    // Financials & Costs
    createActualCost: builder.mutation<ProjectCostingProject, { id: number; body: CreateActualCostRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/create_actual_cost/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProjectCosting", id }],
    }),
    createCommitment: builder.mutation<ProjectCostingProject, { id: number; body: CreateCommitmentRequest }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/create_commitment/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "ProjectCosting", id }],
    }),
    getProjectTransactions: builder.query<ProjectTransaction[], number>({
      query: (id) => `/project-costing/projects/${id}/transactions/`,
      providesTags: (result, error, id) => [{ type: "ProjectCosting", id }],
    }),
    getProjectFinancials: builder.query<ProjectCostingProject, number>({
      query: (id) => `/project-costing/projects/${id}/financials/`,
      providesTags: (result, error, id) => [{ type: "ProjectCosting", id }],
    }),

    // Dashboards & Imports
    getProjectDashboard: builder.query<ProjectCostingProject, number>({
      query: (id) => `/project-costing/projects/${id}/dashboard/`,
      providesTags: (result, error, id) => [{ type: "ProjectCosting", id }],
    }),
    importProjectXlsx: builder.mutation<ProjectCostingProject, { id: number; body: FormData }>({
      query: ({ id, body }) => ({
        url: `/project-costing/projects/${id}/import_xlsx/`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
  useCreateProjectCostingProjectMutation,
  useCreatePendingProjectCostingProjectMutation,
  useUpdateProjectCostingProjectMutation,
  usePatchProjectCostingProjectMutation,
  useDeleteProjectCostingProjectMutation,
  useApproveProjectMutation,
  useCloseProjectMutation,
  useRejectProjectMutation,
  useSubmitProjectMutation,
  useAddProjectDocumentMutation,
  useCreateAddPhaseActivityMutation,
  useDeletePhaseMutation,
  useUpdatePhaseBundleMutation,
  useApproveBudgetAdjustmentMutation,
  useCreateBudgetAdjustmentMutation,
  useRejectBudgetAdjustmentMutation,
  useSubmitBudgetAdjustmentMutation,
  useGetBudgetAdjustmentsQuery,
  useGetProjectSettingsQuery,
  useUpdateProjectSettingsMutation,
  useCreateActualCostMutation,
  useCreateCommitmentMutation,
  useGetProjectTransactionsQuery,
  useGetProjectFinancialsQuery,
  useGetProjectDashboardQuery,
  useImportProjectXlsxMutation,
} = projectCostingApi;
