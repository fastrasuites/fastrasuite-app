import { createApi } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store/store";
import type {
  SubcontractorRequest,
  CreateSubcontractorRequest,
  GetSubcontractorRequestsParams,
  Milestone,
} from "@/types/subcontractorRequest";

// Helper function to get tenant-specific base URL
const getTenantBaseUrl = (state: RootState): string => {
  const tenantSchemaName = state.auth.tenant_schema_name;
  const apiDomain =
    process.env.NEXT_PUBLIC_API_DOMAIN || "fastrasuiteapi.com.ng";
  const protocol =
    apiDomain.includes("localhost") || apiDomain.includes("127.0.0.1")
      ? "http"
      : "https";
  return `${protocol}://${tenantSchemaName}.${apiDomain}`;
};

export const subcontractorRequestApi = createApi({
  reducerPath: "subcontractorRequestApi",
  tagTypes: ["SubcontractorRequest", "SubcontractorMilestone"],
  baseQuery: async (args, api, extraOptions) => {
    const state = api.getState() as RootState;
    const baseUrl = getTenantBaseUrl(state);
    const token = state.auth.access_token;

    const headers = new Headers();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
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
    getSubcontractorRequests: builder.query<
      SubcontractorRequest[],
      GetSubcontractorRequestsParams | void
    >({
      query: (params) => ({
        url: "/project-requests/subcontractor-requests/",
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
            type: "SubcontractorRequest" as const,
            id,
          })),
          { type: "SubcontractorRequest", id: "LIST" },
          "SubcontractorRequest",
        ];
      },
    }),
    getSubcontractorRequest: builder.query<
      SubcontractorRequest,
      number | string
    >({
      query: (id) => `/project-requests/subcontractor-requests/${id}/`,
      providesTags: (result, error, id) => [
        { type: "SubcontractorRequest", id },
        "SubcontractorRequest",
      ],
    }),
    createSubcontractorRequest: builder.mutation<
      SubcontractorRequest,
      CreateSubcontractorRequest
    >({
      query: (body) => ({
        url: "/project-requests/subcontractor-requests/",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "SubcontractorRequest",
        { type: "SubcontractorRequest", id: "LIST" },
      ],
    }),
    updateSubcontractorRequest: builder.mutation<
      SubcontractorRequest,
      { id: number | string; body: Partial<SubcontractorRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/project-requests/subcontractor-requests/${id}/`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SubcontractorRequest", id },
        { type: "SubcontractorRequest", id: "LIST" },
        "SubcontractorRequest",
      ],
    }),
    deleteSubcontractorRequest: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/project-requests/subcontractor-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SubcontractorRequest", id },
        { type: "SubcontractorRequest", id: "LIST" },
        "SubcontractorRequest",
      ],
    }),
    submitSubcontractorRequest: builder.mutation<
      SubcontractorRequest,
      {
        id: number | string;
        subcontractorRequestId?: number | string;
        data?: any;
      }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id, subcontractorRequestId }) => [
        { type: "SubcontractorRequest", id },
        ...(subcontractorRequestId
          ? [
              {
                type: "SubcontractorRequest" as const,
                id: subcontractorRequestId,
              },
            ]
          : []),
        { type: "SubcontractorRequest", id: "LIST" },
        "SubcontractorRequest",
      ],
    }),
    // Milestone endpoints
    getSubcontractorMilestones: builder.query<
      Milestone[],
      GetSubcontractorRequestsParams | void
    >({
      query: (params) => ({
        url: "/project-requests/subcontractor-milestone/",
        params: params || undefined,
      }),
      providesTags: ["SubcontractorMilestone"],
    }),
    createSubcontractorMilestone: builder.mutation<
      Milestone,
      Partial<Milestone>
    >({
      query: (body) => ({
        url: "/project-requests/subcontractor-milestone/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SubcontractorMilestone"],
    }),
    // NEW – Mark a milestone as completed
    markSubcontractorMilestoneComplete: builder.mutation<
      Milestone,
      number | string
    >({
      query: (id) => ({
        url: `/project-requests/subcontractor-milestone/${id}/`,
        method: "PATCH",
        body: { is_completed: true },
      }),
      invalidatesTags: [
        "SubcontractorMilestone",
        "SubcontractorRequest",
        { type: "SubcontractorRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSubcontractorRequestsQuery,
  useGetSubcontractorRequestQuery,
  useCreateSubcontractorRequestMutation,
  useUpdateSubcontractorRequestMutation,
  useDeleteSubcontractorRequestMutation,
  useSubmitSubcontractorRequestMutation,
  useGetSubcontractorMilestonesQuery,
  useCreateSubcontractorMilestoneMutation,
  useMarkSubcontractorMilestoneCompleteMutation,
} = subcontractorRequestApi;
