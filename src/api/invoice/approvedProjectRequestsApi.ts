import { createApi } from "@reduxjs/toolkit/query/react";
import { createTenantBaseQuery } from "@/api/baseQueryWithReauth";

/** Simple shape returned by the list endpoint */
export interface ApprovedProjectRequest {
  id: number;
  reference_id: string;
  request_type: "labour" | "purchase" | "subcontractor" | string;
  activity_name: string;
  phase_name: string;
  approval_date: string;
  cost_category: string;
  required_amount: string;
}

export interface TenantUser {
  url?: string;
  id?: number;
  user?: {
    url?: string;
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  phone_number?: string;
  language?: string;
  timezone?: string;
  in_app_notifications?: boolean;
  email_notifications?: boolean;
}
export interface GetApprovedProjectRequestsParams {
  ordering?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/** ========== Shared nested types ========== */

export interface ApprovedProjectRequestLine {
  id: number;
  product: number;
  description: string;
  quantity: string;
  estimated_unit_cost: string;
  line_total: string;
  product_name: string;
  unit_of_measure: number;
  unit_of_measure_name: string;
  unit_of_measure_symbol: string;
}

export interface ProjectRequestInfo {
  id: number;
  reference_id: string;
  request_type: string;
  status: string;
  request_amount: number;
}

export interface ProjectDetails {
  id: number;
  name: string;
  project_code: string;
}

export interface PhaseDetails {
  id: string;
  name: string;
  code: string;
}

export interface ActivityDetails {
  id: string;
  name: string;
  serial_number: number;
}

export interface SubcontractorMilestone {
  id: number;
  name?: string;
  description?: string;
  completion_criteria?: string;
  amount?: number | string;
  percentage?: number | string;
  is_completed?: boolean;
  is_paid?: boolean;
  /** Backend flag — true when a vendor bill already exists for this milestone */
  is_billed?: boolean;
  subcontractor_request?: number;
  completion_record?: string;
  [key: string]: unknown;
}

/**
 * Full response from /invoicing/approved-project-request/{id}/details/
 * Covers Purchase, Subcontractor, and Plant & Equipment, labour and petty cash.
 * Type-specific fields are optional.
 */
export interface ApprovedProjectRequestDetails {
  id: number;
  project_request: ProjectRequestInfo;
  project_details: ProjectDetails;
  phase_details: PhaseDetails;
  activity_details: ActivityDetails;
  available_budget: string;
  created_at?: string;

  // Purchase
  created_by_id?: number;
  site_location?: string;
  required_by_date?: string;
  notes?: string;
  lines?: ApprovedProjectRequestLine[];
  total_amount?: string;
  updated_at?: string;

  // Subcontractor
  milestones?: SubcontractorMilestone[];
  vendor?: number | null;
  vendor_name?: string;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  scope_of_work?: string;
  payment_type?: string;
  contract_value?: string;
  payment_terms?: string;
  start_date?: string;
  end_date?: string;
  justification_notes?: string;

  // Plant & Equipment
  project_request_id?: number;
  reference_id?: string;
  equipment_name?: string;
  description?: string;
  quantity?: number;
  required_date?: string;
  estimated_cost?: string;
  expected_return_date?: string | null;
  created_by_name?: string;

  // Labour
  date_required?: string;
  number_of_workers?: number;
  role_type?: string;
  duration?: number;
  duration_unit?: string;
  estimated_daily_rate?: string;
  projected_cost?: string;
  requester_details?: TenantUser | undefined;

  // Petty Cash
  amount_requested?: string;
  purpose?: string;
  is_hidden?: boolean;
}

/** ========== API definition ========== */

export const approvedProjectRequestsApi = createApi({
  reducerPath: "approvedProjectRequestsApi",
  baseQuery: createTenantBaseQuery(),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getApprovedProjectRequests: builder.query<
      ApprovedProjectRequest[],
      GetApprovedProjectRequestsParams | void
    >({
      // Avoid passing `void` into FetchArgs.params (expects Record | undefined)
      query: (params) => ({
        url: "/invoicing/approved-project-request/",
        ...(params ? { params } : {}),
      }),
    }),

    getApprovedProjectRequestById: builder.query<
      ApprovedProjectRequest,
      number
    >({
      query: (id) => `/invoicing/approved-project-request/${id}/`,
    }),

    getApprovedProjectRequestDetails: builder.query<
      ApprovedProjectRequestDetails,
      number
    >({
      query: (id) => `/invoicing/approved-project-request/${id}/details/`,
    }),
  }),
});

export const {
  useGetApprovedProjectRequestsQuery,
  useGetApprovedProjectRequestByIdQuery,
  useGetApprovedProjectRequestDetailsQuery,
} = approvedProjectRequestsApi;
