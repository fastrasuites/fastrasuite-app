import { z } from "zod";

export type RequestStatus = "draft" | "approved" | "pending" | "rejected";

export interface SummaryCountConfig {
  status: RequestStatus;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
}

export interface RequestDashboardConfig<T> {
  title: string;
  idPrefix: string;
  newRequestPath: string;
  statusCounts: Record<RequestStatus, number>;
  summaryConfigs: SummaryCountConfig[];
  renderItem: (item: T) => React.ReactNode;
  mockData: T[];
}

export type FormFieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "date"
  | "milestones"
  | "checkbox";

export interface FormFieldOption {
  label: string;
  value: string;
  amount?: number;
}

export interface RequestFormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: FormFieldOption[];
  rows?: number;
  className?: string;
  hintText?: string;
  hintNode?: React.ReactNode;
  action?: React.ReactNode;
  disabled?: boolean;
  emptyMessage?: string;
  halfWidth?: boolean;
  dependsOn?: string;
  visibleIf?: { field: string; value: any }; // New: only show if field equals value
  getDynamicLabel?: (values: any) => string;
  getDynamicPlaceholder?: (values: any) => string;
}

export interface RequestFormConfig<T extends Record<string, any>> {
  title: string;
  requestId: string;
  requesterName: string;
  date: string;
  sections: {
    title?: string;
    fields: RequestFormField[];
    renderTop?: (data: T, extra?: any) => React.ReactNode;
    renderBottom?: (data: T, extra?: any) => React.ReactNode;
  }[];
  schema: z.ZodSchema<T>;
  defaultValues: T;
  costCode?: string;
  onSubmit: (data: T) => Promise<void>;
  successMessage: {
    title: string;
    description: string;
  };
  errorMessage?: {
    title: string;
    description: string;
  };
  backPath: string;
  calculateProjectedCost?: (data: T) => number;
  renderHeader?: () => React.ReactNode;
  budgetConfig?: {
    projectField: string;
    wbsField: string;
    costCode: string;
  };
}
