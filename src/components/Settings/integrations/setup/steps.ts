/* Definition of the Setup wizard shown in the left menu:
   CONNECTION → MAPPINGS → CONFIGURATION */

export type SetupStepId =
  | "odoo_connection"
  | "company_selection"
  | "vendor_mapping"
  | "chart_of_accounts"
  | "purchase_journal"
  | "tax_mapping"
  | "currency_mapping";

export const SETUP_STEP_ORDER: SetupStepId[] = [
  "odoo_connection",
  "company_selection",
  "vendor_mapping",
  "chart_of_accounts",
  "purchase_journal",
  "tax_mapping",
  "currency_mapping",
];

export const SETUP_STEP_LABELS: Record<SetupStepId, string> = {
  odoo_connection: "Odoo Connection",
  company_selection: "Company Selection",
  vendor_mapping: "Vendor Mapping",
  chart_of_accounts: "Chart of Accounts",
  purchase_journal: "Purchase Journal",
  tax_mapping: "Tax Mapping",
  currency_mapping: "Currency Mapping",
};

export interface SetupStepGroup {
  label: string;
  steps: SetupStepId[];
}

export const SETUP_STEP_GROUPS: SetupStepGroup[] = [
  { label: "Connection", steps: ["odoo_connection", "company_selection"] },
  { label: "Mappings", steps: ["vendor_mapping", "chart_of_accounts"] },
  {
    label: "Configuration",
    steps: ["purchase_journal", "tax_mapping", "currency_mapping"],
  },
];
