export interface Milestone {
  id?: number;
  name: string;
  percentage: string | number;
  completion_criteria: string;
  is_completed?: boolean;
  amount?: string | number;
  is_paid?: boolean;
  subcontractor_request?: number;
}

export type SubcontractorRequestStatus = 
  | "draft" 
  | "submitted" 
  | "clarification_needed" 
  | "approved" 
  | "in_progress" 
  | "completed" 
  | "rejected"
  | "pending";

export interface SubcontractorRequest {
  id: number;
  reference_id: string;
  status: SubcontractorRequestStatus;
  milestones: Milestone[];
  vendor_name: string;
  vendor_email: string | null;
  vendor_phone: string | null;
  scope_of_work: string;
  payment_type: "lump_sum" | "milestone" | string;
  contract_value: string;
  payment_terms: string;
  start_date: string;
  end_date: string;
  justification_notes: string;
  created_at: string;
  project_request: number | any;
  project_details?: {
    id: number;
    name: string;
    project_code: string;
  };
  phase_details?: {
    id: string;
    name: string;
    code: string;
  };
  activity_details?: {
    id: string;
    name: string;
    serial_number: number;
  };
  available_budget?: string | number;
  vendor: number;
  created_by?: number;
  created_by_name?: string;
  requester?: string;
}

export interface CreateSubcontractorRequest {
  project?: number;
  activity?: string;
  vendor: number;
  vendor_name?: string;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  scope_of_work: string;
  payment_type: string;
  contract_value: string;
  payment_terms?: string;
  start_date: string;
  end_date: string;
  justification_notes?: string;
  milestones?: any[];
}

export interface GetSubcontractorRequestsParams {
  ordering?: string;
  search?: string;
}
