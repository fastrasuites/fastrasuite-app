import { createApi } from "@reduxjs/toolkit/query/react";
// import type { RootState } from "@/lib/store/store";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";
import type {
  DashboardCountsResponse,
  DashboardFinancialSummaryResponse,
  DashboardProjectChartResponse,
} from "@/types/dashboard";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  tagTypes: ["Dashboard"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getDashboardCounts: builder.query<DashboardCountsResponse, void>({
      query: () => "/dashboard/counts/",
      providesTags: ["Dashboard"],
    }),
    getDashboardFinancialSummary: builder.query<
      DashboardFinancialSummaryResponse,
      void
    >({
      query: () => "/dashboard/financial-summary/",
      providesTags: ["Dashboard"],
    }),
    getDashboardProjectChart: builder.query<
      DashboardProjectChartResponse,
      void
    >({
      query: () => "/dashboard/project-chart/",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetDashboardCountsQuery,
  useGetDashboardFinancialSummaryQuery,
  useGetDashboardProjectChartQuery,
} = dashboardApi;
