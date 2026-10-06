import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

// Define nested response types
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface RequesterDetails {
  id: number;
  user?: User;
  role?: string;
  phone_number?: string;
  language?: string;
  timezone?: string;
  in_app_notifications?: boolean;
  email_notifications?: boolean;
  groups?: string[];
}

export interface UnitOfMeasureDetails {
  unit_name?: string;
  unit_symbol?: string;
  unit_category?: string;
}

export interface ProductDetails {
  id: number;
  product_name: string;
  product_description?: string;
  product_category?: string;
  unit_of_measure?: number;
  unit_of_measure_details?: UnitOfMeasureDetails;
  [key: string]: any;
}

export interface ProjectPurchaseRequestLine {
  id?: number;
  product: number;
  product_details?: ProductDetails;
  description?: string;
  quantity: string | number;
  estimated_unit_cost: string | number;
  line_total?: string | number;
  // Legacy or alternate fields for robustness across API formats
  qty?: string | number;
  estimated_unit_price?: string | number;
}

export interface ProjectDetails {
  id: number;
  name: string;
  code: string;
}

export interface ProjectRequestMaster {
  id: number;
  reference_id?: string;
  request_type?: string;
  status?: "draft" | "approved" | "pending" | "rejected" | string;
  project?: number;
  project_details?: ProjectDetails;
  created_by?: number;
  created_by_details?: RequesterDetails;
  created_at?: string;
  updated_at?: string;
  detail?: any;
}

export interface CurrencyDetails {
  id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
}

export interface VendorDetails {
  id: number;
  company_name: string;
  email?: string;
  phone_number?: string;
}

// Main response type matching both Swagger API docs & existing UI mapping
export interface ProjectPurchaseRequest {
  id: number | string;
  project_request?: number | ProjectRequestMaster;
  project?: number;
  project_details?: ProjectDetails;
  activity?: string;
  site_location?: string;
  required_by_date?: string;
  notes?: string;
  lines?: ProjectPurchaseRequestLine[];
  total_amount?: string | number;
  created_at?: string;
  updated_at?: string;
  // Fallbacks and legacy fields for compatibility
  status?: "draft" | "approved" | "pending" | "rejected" | string;
  purpose?: string;
  date_created?: string;
  date_updated?: string;
  items?: ProjectPurchaseRequestLine[];
  pr_total_price?: string | number;
  requester?: number;
  requester_details?: RequesterDetails;
  requesting_location?: string;
  requesting_location_details?: {
    id: string;
    location_name: string;
    [key: string]: any;
  };
  currency?: number;
  currency_details?: CurrencyDetails;
  vendor?: number;
  vendor_details?: VendorDetails;
  [key: string]: any;
}

// Query parameters types
export interface GetProjectPurchaseRequestsParams {
  ordering?: string;
  search?: string;
  status?: string;
  project?: number;
  requester?: number;
  vendor?: number;
  [key: string]: string | number | boolean | undefined;
}

// Request payload types
export interface CreateProjectPurchaseRequestLineItem {
  product: number;
  description?: string;
  quantity: string | number;
  estimated_unit_cost: string | number;
  qty?: string | number;
  estimated_unit_price?: string | number;
}

export interface CreateProjectPurchaseRequest {
  project: number;
  activity?: string;
  site_location: string;
  required_by_date: string;
  notes?: string;
  lines: CreateProjectPurchaseRequestLineItem[];
  // Legacy fields for backward compatibility
  status?: "draft" | "approved" | "pending" | "rejected";
  currency?: number;
  requester?: number;
  requesting_location?: string;
  purpose?: string;
  vendor?: number;
  items?: CreateProjectPurchaseRequestLineItem[];
  [key: string]: any;
}

export interface UpdateProjectPurchaseRequest {
  site_location?: string;
  required_by_date?: string;
  notes?: string;
  lines?: CreateProjectPurchaseRequestLineItem[];
  status?: "draft" | "approved" | "pending" | "rejected";
  currency?: number;
  requester?: number;
  requesting_location?: string;
  purpose?: string;
  vendor?: number;
  items?: CreateProjectPurchaseRequestLineItem[];
  [key: string]: any;
}

export const projectPurchaseRequestApi = createApi({
  reducerPath: "projectPurchaseRequestApi",
  tagTypes: ["ProjectPurchaseRequest"],
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getProjectPurchaseRequests: builder.query<
      ProjectPurchaseRequest[],
      GetProjectPurchaseRequestsParams | void
    >({
      query: (params) => ({
        url: "/project-requests/purchase-requests/",
        params: params || undefined,
      }),
      providesTags: ["ProjectPurchaseRequest"],
    }),
    getProjectPurchaseRequest: builder.query<
      ProjectPurchaseRequest,
      string | number
    >({
      query: (id) => `/project-requests/purchase-requests/${id}/`,
      providesTags: (result, error, id) => [
        { type: "ProjectPurchaseRequest", id },
      ],
    }),
    createProjectPurchaseRequest: builder.mutation<
      ProjectPurchaseRequest,
      CreateProjectPurchaseRequest
    >({
      query: (body) => ({
        url: "/project-requests/purchase-requests/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectPurchaseRequest"],
    }),
    updateProjectPurchaseRequest: builder.mutation<
      ProjectPurchaseRequest,
      { id: string | number; data: UpdateProjectPurchaseRequest }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/purchase-requests/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "ProjectPurchaseRequest",
        { type: "ProjectPurchaseRequest", id },
      ],
    }),
    patchProjectPurchaseRequest: builder.mutation<
      ProjectPurchaseRequest,
      { id: string | number; data: Partial<UpdateProjectPurchaseRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/purchase-requests/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "ProjectPurchaseRequest",
        { type: "ProjectPurchaseRequest", id },
      ],
    }),
    deleteProjectPurchaseRequest: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `/project-requests/project-requests/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectPurchaseRequest"],
    }),
    submitProjectPurchaseRequest: builder.mutation<
      any,
      { id: number | string; data?: any }
    >({
      query: ({ id, data }) => ({
        url: `/project-requests/project-requests/${id}/submit/`,
        method: "POST",
        body: data || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        "ProjectPurchaseRequest",
        { type: "ProjectPurchaseRequest", id },
      ],
    }),
  }),
});

export const {
  useGetProjectPurchaseRequestsQuery,
  useGetProjectPurchaseRequestQuery,
  useCreateProjectPurchaseRequestMutation,
  useUpdateProjectPurchaseRequestMutation,
  usePatchProjectPurchaseRequestMutation,
  useDeleteProjectPurchaseRequestMutation,
  useSubmitProjectPurchaseRequestMutation,
} = projectPurchaseRequestApi;
