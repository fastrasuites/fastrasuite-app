export interface DashboardProjectChartItem {
  id: number | string;
  name: string;
  budget: number | string;
  actual_spent: number | string;
}

export interface DashboardProjectChartResponse {
  projects: DashboardProjectChartItem[];
}

export interface DashboardCountsResponse {
  [key: string]: any;
  project_requests?: {
    total?: number;
    pending?: number;
  };
  purchase_orders?: {
    active?: number;
  } | number;
  vendor_bills?: {
    total?: number;
    overdue?: number;
  };
  incoming_products?: {
    total?: number;
    unreceived?: number;
  };
  project_costing?: {
    active?: number;
  };
}

export interface DashboardFinancialSummaryResponse {
  [key: string]: any;
  purchase_orders?: {
    total_value?: number;
    issued_value?: number;
  };
  invoices?: {
    total_invoiced?: number;
    total_paid?: number;
  };
  overdue_invoice?: {
    total_value?: number;
    count?: number;
  };
  project_costing?: {
    total_budget?: number;
    actual_spent?: number;
    spent_percentage?: number;
    spent_display?: string;
  };
}
