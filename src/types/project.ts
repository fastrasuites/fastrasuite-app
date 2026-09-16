export interface WBS {
  id: number;
  name: string;
  is_activity: boolean;
  parent?: number;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  wbs: WBS[];
}

export interface Budget {
  project_id: number;
  wbs_id: number;
  cost_code: string;
  budgeted_amount: string;
  actual_amount: string;
  committed_amount: string;
  available_budget: string;
}
