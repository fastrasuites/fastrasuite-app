export interface PermissionTypeMeta {
  key: string;
  label: string;
  summary: string;
  entitlements: string[];
}

export interface ModulePermissionMeta {
  moduleKey: string;
  backendModule: string;
  label: string;
  description: string;
  permissionTypes: Record<string, PermissionTypeMeta>;
}

export const MODULE_PERMISSION_DESCRIPTIONS: Record<string, ModulePermissionMeta> = {
  projectRequest: {
    moduleKey: "projectRequest",
    backendModule: "project_request",
    label: "Project Request Module",
    description: "Submit, inspect, and approve internal project requests including labour, petty cash, materials, and equipment.",
    permissionTypes: {
      requester: {
        key: "requester",
        label: "Requester",
        summary: "Can create, edit draft requests, and submit new project requests.",
        entitlements: [
          "View own submitted requests",
          "Create new project requests",
          "Submit requests for approval",
          "Edit draft and returned requests",
        ],
      },
      reviewer: {
        key: "reviewer",
        label: "Reviewer",
        summary: "Read-only access to browse and inspect all project requests across the company.",
        entitlements: [
          "View all project requests",
          "View attachments and costing breakdowns",
        ],
      },
      approver: {
        key: "approver",
        label: "Approver",
        summary: "Can evaluate, approve, or reject submitted project requests with notes.",
        entitlements: [
          "View all project requests",
          "Approve submitted requests",
          "Reject requests with mandatory notes",
        ],
      },
      manager: {
        key: "manager",
        label: "Manager",
        summary: "Managerial oversight to submit, edit, and supervise project request operations.",
        entitlements: [
          "View all project requests",
          "Submit requests directly",
          "Edit and manage request line items",
        ],
      },
      administrator: {
        key: "administrator",
        label: "Administrator",
        summary: "Full unrestricted administrative access across the entire Project Request workflow.",
        entitlements: [
          "Full view, create, and submit access",
          "Approve and reject requests",
          "Edit and delete request records",
        ],
      },
    },
  },
  projectCosting: {
    moduleKey: "projectCosting",
    backendModule: "project_costing",
    label: "Project Costing Module",
    description: "Track project expenses, work breakdown structures (WBS), budget baselines, and financial health.",
    permissionTypes: {
      reviewer: {
        key: "reviewer",
        label: "Reviewer",
        summary: "Read-only access to view project metrics, dashboards, and budget adjustments.",
        entitlements: [
          "View project details",
          "View costing reports",
          "View project financials",
          "View project costing dashboard",
          "View budget adjustment history",
          "View budget adjustment detail",
        ],
      },
      approver: {
        key: "approver",
        label: "Approver",
        summary: "Can sign off on project proposals, budget adjustments, and costing approvals.",
        entitlements: [
          "View projects, financials, reports, and dashboards",
          "View transaction ledgers",
          "Approve and reject project proposals",
          "Approve and reject budget adjustments",
        ],
      },
      manager: {
        key: "manager",
        label: "Manager",
        summary: "Can create projects, manage budgets, configure alerts, and structure WBS items.",
        entitlements: [
          "Create and edit projects",
          "Create, edit, and delete WBS activities",
          "Configure and adjust budgets",
          "Configure project alerts and thresholds",
          "Submit projects and budget adjustments",
          "Export financial & costing reports",
        ],
      },
      administrator: {
        key: "administrator",
        label: "Administrator",
        summary: "Full control over projects, cost codes, budget overrides, and project closure/archiving.",
        entitlements: [
          "All manager & approver capabilities",
          "Delete and archive projects",
          "Close completed projects",
          "Manage cost codes & system baselines",
        ],
      },
    },
  },
  invoice: {
    moduleKey: "invoice",
    backendModule: "invoice",
    label: "Invoice Module",
    description: "Manage accounts payable, vendor bills, invoice matching, and outbound disbursements.",
    permissionTypes: {
      reviewer: {
        key: "reviewer",
        label: "Reviewer",
        summary: "Read-only access to inspect purchase orders, payable queues, and cash flow reports.",
        entitlements: [
          "View approved requests",
          "View purchase orders",
          "View accounts payable queue",
          "View cash flow reports",
        ],
      },
      processor: {
        key: "processor",
        label: "Processor",
        summary: "Operational handler for processing vendor bills, purchase orders, and AP queues.",
        entitlements: [
          "View and edit invoices",
          "Convert approved requests to purchase orders",
          "Manage accounts payable queue",
          "Issue, cancel, receive, and close purchase orders",
        ],
      },
      approver: {
        key: "approver",
        label: "Approver",
        summary: "Can inspect invoices and authorize bills for payment disbursement.",
        entitlements: [
          "View invoices and purchase orders",
          "Approve invoices for payment processing",
        ],
      },
      payer: {
        key: "payer",
        label: "Payer",
        summary: "Authorized to execute outgoing payments and log disbursements in the queue.",
        entitlements: [
          "View accounts payable queue",
          "Execute payment disbursements",
        ],
      },
      administrator: {
        key: "administrator",
        label: "Administrator",
        summary: "Full administrative control over invoice configurations, tolerances, and payouts.",
        entitlements: [
          "Full operational & approval access",
          "Configure invoice settings",
          "Configure 2-point match tolerance rules",
          "Delete invoice records",
        ],
      },
    },
  },
  inventory: {
    moduleKey: "inventory",
    backendModule: "inventory",
    label: "Inventory Module",
    description: "Oversee warehouses, stock movements, receipts, scrap validations, and product catalog.",
    permissionTypes: {
      requester: {
        key: "requester",
        label: "Requester",
        summary: "Basic inventory user capable of requesting stock transfers and material consumption.",
        entitlements: [
          "Request material consumption",
          "Request internal stock transfers",
        ],
      },
      reviewer: {
        key: "reviewer",
        label: "Reviewer",
        summary: "Read-only access to check inventory ledgers, stock counts, products, and units.",
        entitlements: [
          "View stock on hand",
          "View inventory ledger & stock moves",
          "View products and categories",
          "View units of measure and locations",
        ],
      },
      approver: {
        key: "approver",
        label: "Approver",
        summary: "Can confirm physical receipts, approve material consumption, and validate scraps.",
        entitlements: [
          "Confirm material receipts from suppliers",
          "Approve material consumption requests",
          "Validate stock adjustments and scraps",
        ],
      },
      manager: {
        key: "manager",
        label: "Manager",
        summary: "Can manage product catalogs, configure units of measure, and set low stock alerts.",
        entitlements: [
          "Create and edit products",
          "Create and edit units of measure",
          "Configure low stock alert thresholds",
          "Manage stock adjustments and receipts",
        ],
      },
      administrator: {
        key: "administrator",
        label: "Administrator",
        summary: "Full administrative and configuration control across all warehouses, locations, and catalogs.",
        entitlements: [
          "All manager & approver capabilities",
          "Delete products, units of measure, and delivery records",
          "Perform manual stock adjustments",
          "Manage multi-location warehouse settings",
          "Create and execute delivery orders & returns",
        ],
      },
    },
  },
  settings: {
    moduleKey: "settings",
    backendModule: "settings",
    label: "Settings",
    description: "Global system configuration, user administration, security, and company profiles.",
    permissionTypes: {
      administrator: {
        key: "administrator",
        label: "Administrator",
        summary: "Full unrestricted access to all organization settings, user profiles, and permission templates.",
        entitlements: [
          "Manage company organization details",
          "Create, edit, archive, and reset passwords for users",
          "Create and assign permission templates",
          "Configure multi-location warehouse switches",
        ],
      },
    },
  },
};
