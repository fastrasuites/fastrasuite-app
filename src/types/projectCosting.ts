export interface ProjectCostingFilterParams {
  ordering?: string;
  search?: string;
  status?: string;
  [key: string]: any;
}

export interface Activity {
  id?: string | number;
  name?: string;
  amount?: string | number;
  [key: string]: any;
}

export interface Phase {
  id?: string | number;
  name?: string;
  activities?: Activity[];
  [key: string]: any;
}

export interface ProjectCostingProject {
  id: number;
  project_code: string;
  name: string;
  client_name: string;
  project_type: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "CLOSED" | "REJECTED" | string;
  start_date: string;
  expected_end_date: string;
  description: string;
  phases?: Phase[] | any;
  financials?: any;
  allow_budget_decrease?: boolean;
  [key: string]: any;
}

export interface CreateProjectCostingProjectRequest {
  name: string;
  client_name: string;
  project_type: string;
  start_date: string;
  expected_end_date: string;
  description: string;
  site_location: string;
  phases?: Phase[];
}

export interface UpdateProjectCostingProjectRequest {
  project_code?: string;
  name?: string;
  client_name?: string;
  project_type?: string;
  status?: string;
  start_date?: string;
  expected_end_date?: string;
  description?: string;
}

export interface CreateAddPhaseActivityRequest {
  phase_id?: string | number;
  name?: string; // For new phase
  activities: Activity[];
}

export interface UpdatePhaseBundleRequest {
  name?: string;
  activities?: Activity[];
  [key: string]: any;
}

export interface DeletePhaseRequest {
  phase_id: string | number;
  activity_ids?: Array<string | number>;
}

export interface CreateActualCostRequest {
  [key: string]: any;
}

export interface CreateBudgetAdjustmentRequest {
  [key: string]: any;
}

export interface CreateCommitmentRequest {
  [key: string]: any;
}

export interface ProjectActionRequest {
  [key: string]: any;
}

export interface BudgetAdjustment {
  id: number;
  [key: string]: any;
}

export interface ProjectTransaction {
  id: number;
  [key: string]: any;
}

export interface ImportXlsxRequest {
  file: File;
  [key: string]: any;
}
