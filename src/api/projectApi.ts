import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Project, Budget } from "@/types/project";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "/projects/",
    }),
    getProject: builder.query<Project, number>({
      query: (id) => `/projects/${id}/`,
    }),
    getAvailableBudget: builder.query<
      Budget,
      { project_id: number; wbs_id: number | string; cost_code: string }
    >({
      query: (params) => ({
        url: "/budget/available/",
        params,
      }),
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetAvailableBudgetQuery,
} = projectApi;
