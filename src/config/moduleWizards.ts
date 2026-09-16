export interface WizardStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or data-wizard attribute, e.g. '[data-wizard="new-project"]'
  route?: string; // Expected route for this step
  nextRoute?: string; // Optional auto-navigation route when advancing
  preferredPosition?: "top" | "bottom" | "left" | "right" | "auto";
  actionText?: string;
  actionType?: "next" | "navigate" | "action";
  successFeedback?: string; // Temporary toast feedback when action completes
  tab?: string; // Optional tab to activate on enter (e.g. "phases", "adjustments", "documents", "settings")
}

export interface PageInvitation {
  routePattern: string; // e.g. "/project-costing/[id]"
  title: string;
  text: string;
}

export interface ModuleWizardConfig {
  moduleId: string;
  moduleName: string;
  rootRoute: string;
  invitationTitle: string;
  invitationText: string;
  completionTitle: string;
  completionText: string;
  pageInvitations?: PageInvitation[];
  nextModule?: {
    name: string;
    route: string;
  };
  steps: WizardStep[];
}

export const MODULE_WIZARDS: Record<string, ModuleWizardConfig> = {
  "project-costing": {
    moduleId: "project-costing",
    moduleName: "Project Costing",
    rootRoute: "/project-costing",
    invitationTitle: "New to Project Costing?",
    invitationText: "Walk through setting up project budgets, WBS items, tracking spend, and approvals.",
    completionTitle: "Project Costing Complete",
    completionText: "Your project budget is active and ready to receive field requisitions.",
    pageInvitations: [
      {
        routePattern: "/project-costing/[id]",
        title: "Explore Project Dashboard",
        text: "Learn how to track spend vs budget curves, check variance, and submit budget adjustments.",
      },
      {
        routePattern: "/project-costing/new",
        title: "New Project Costing",
        text: "Set up project basic information, import WBS Excel sheets, and submit for approval.",
      },
    ],
    nextModule: {
      name: "Project Request",
      route: "/project-request",
    },
    steps: [
      {
        id: "new-project",
        title: "Create a Project",
        description: "Start by creating a new project budget and defining project information.",
        target: '[data-wizard="pc-new-project"]',
        route: "/project-costing",
        nextRoute: "/project-costing/new",
        preferredPosition: "bottom",
        actionText: "New Project",
        actionType: "navigate",
      },
      {
        id: "basic-info",
        title: "Basic Information",
        description: "Enter project title, client, contract type, and scheduled project duration.",
        target: '[data-wizard="pc-basic-info"]',
        route: "/project-costing/new",
        preferredPosition: "bottom",
        actionText: "Next",
      },
      {
        id: "wbs-breakdown",
        title: "Work Breakdown Structure",
        description: "Add phases, cost items, unit rates, or import from an Excel template.",
        target: '[data-wizard="pc-wbs-section"]',
        route: "/project-costing/new",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "submit-project",
        title: "Submit for Approval",
        description: "Submit the project costing to send it to management for formal approval.",
        target: '[data-wizard="pc-submit-button"]',
        route: "/project-costing/new",
        preferredPosition: "top",
        actionText: "Review Details",
        successFeedback: "Project created ✓",
      },
      {
        id: "dashboard-kpis",
        title: "Financial KPIs & Spend",
        description: "Track planned budget vs actual spend, commitments, and financial variance.",
        target: '[data-wizard="pc-kpis-chart"]',
        route: "/project-costing/[id]",
        preferredPosition: "bottom",
        actionText: "Next",
      },
      {
        id: "dashboard-charts",
        title: "S-Curve & Category Charts",
        description: "Analyze cumulative expenditure trends and percentage distribution across cost categories.",
        target: '[data-wizard="pc-charts-section"]',
        route: "/project-costing/[id]",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "phases-breakdown",
        title: "Phases & Activities WBS",
        description: "Inspect the detailed work breakdown structure, individual unit rates, and activity limits.",
        target: '[data-wizard="pc-phases-table"]',
        route: "/project-costing/[id]",
        tab: "phases",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "create-adjustment",
        title: "Create Budget Adjustment",
        description: "Request budget increases, decreases, or add newly discovered activities on site.",
        target: '[data-wizard="pc-create-adjustment-btn"]',
        route: "/project-costing/[id]",
        preferredPosition: "bottom",
        actionText: "Next",
      },
      {
        id: "approve-adjustments",
        title: "Review & Approve Adjustments",
        description: "Examine proposed budget line changes and approve or reject adjustment requests.",
        target: '[data-wizard="pc-adjustments-content"]',
        route: "/project-costing/[id]",
        tab: "adjustments",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "project-documents",
        title: "Documents & External Links",
        description: "Manage supporting contracts, technical drawings, and external site reference files.",
        target: '[data-wizard="pc-documents-content"]',
        route: "/project-costing/[id]",
        tab: "documents",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "project-settings",
        title: "Budget Decrease Policy",
        description: "Configure project control policies like permitting or restricting budget decreases.",
        target: '[data-wizard="pc-settings-content"]',
        route: "/project-costing/[id]",
        tab: "settings",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "recent-transactions",
        title: "Recent Transactions Ledger",
        description: "Review all live material consumptions, disbursements, and field expenses in real time.",
        target: '[data-wizard="pc-transactions-table"]',
        route: "/project-costing/[id]",
        tab: "phases",
        preferredPosition: "top",
        actionText: "Next",
      },
      {
        id: "export-approvals",
        title: "Export Reports & Actions",
        description: "Export high-resolution PDF or Image executive reports, and perform project approvals.",
        target: '[data-wizard="pc-header-actions"]',
        route: "/project-costing/[id]",
        preferredPosition: "bottom",
        actionText: "Got it",
        successFeedback: "Project costing ready ✓",
      },
    ],
  },

  "project-request": {
    moduleId: "project-request",
    moduleName: "Project Request",
    rootRoute: "/project-request",
    invitationTitle: "New to Project Requests?",
    invitationText: "Discover how field teams create requisitions and approvers verify them.",
    completionTitle: "Project Request Flow Ready",
    completionText: "Approved requests are automatically forwarded to Invoicing and Procurement.",
    nextModule: {
      name: "Invoice & Payables",
      route: "/invoice/approved-requests",
    },
    steps: [
      {
        id: "make-request",
        title: "Make a Request",
        description: "Create a new requisition for site materials, labour, equipment, or petty cash.",
        target: '[data-wizard="pr-make-request-card"]',
        route: "/project-request",
        nextRoute: "/project-request/make-request",
        preferredPosition: "bottom",
        actionText: "Next",
        actionType: "navigate",
      },
      {
        id: "request-types",
        title: "Select Requisition Category",
        description: "Choose Purchase, Labour, Equipment, Subcontractor, or Material Consumption.",
        target: '[data-wizard="pr-request-types-grid"]',
        route: "/project-request/make-request",
        nextRoute: "/project-request/purchase-request/new",
        preferredPosition: "bottom",
        actionText: "Fill Form",
        actionType: "navigate",
      },
      {
        id: "project-wbs-select",
        title: "Attach to Project WBS",
        description: "Select the active project, phase, and budget activity for the requisition.",
        target: '[data-wizard="pr-project-wbs-select"]',
        route: "/project-request/purchase-request/new",
        preferredPosition: "bottom",
        actionText: "Next",
      },
      {
        id: "items-submit",
        title: "Specify Items & Submit",
        description: "Add items, quantities, estimated rates, and submit for management review.",
        target: '[data-wizard="pr-items-submit"]',
        route: "/project-request/purchase-request/new",
        nextRoute: "/project-request/approve",
        preferredPosition: "top",
        actionText: "Approvals",
        actionType: "navigate",
        successFeedback: "Request submitted ✓",
      },
      {
        id: "approve-requests",
        title: "Review & Approve Requests",
        description: "Approvers review pending requisitions and approve them to forward to Finance.",
        target: '[data-wizard="pr-approve-action"]',
        route: "/project-request/approve",
        preferredPosition: "bottom",
        actionText: "Got it",
        successFeedback: "Request approved ✓",
      },
    ],
  },

  "invoice": {
    moduleId: "invoice",
    moduleName: "Invoice",
    rootRoute: "/invoice/approved-requests",
    invitationTitle: "New to Invoicing?",
    invitationText: "See how approved project requests convert to Purchase Orders, Bills, and Payments.",
    completionTitle: "Invoice & Procurement Ready",
    completionText: "Purchase Orders are issued to vendors and bills are scheduled in the Payment Queue.",
    nextModule: {
      name: "Inventory Operations",
      route: "/inventory/operation/incoming_product",
    },
    steps: [
      {
        id: "approved-requests",
        title: "Approved Requisitions",
        description: "View all field requests approved by project managers ready for billing.",
        target: '[data-wizard="inv-approved-table"]',
        route: "/invoice/approved-requests",
        preferredPosition: "bottom",
        actionText: "Next",
      },
      {
        id: "convert-po",
        title: "Generate Purchase Order",
        description: "Assign vendors, payment terms, and convert requests into formal POs.",
        target: '[data-wizard="inv-convert-action"]',
        route: "/invoice/approved-requests",
        nextRoute: "/invoice/purchase-order",
        preferredPosition: "bottom",
        actionText: "View POs",
        actionType: "navigate",
      },
      {
        id: "purchase-orders",
        title: "Issue POs & Create Bills",
        description: "Issue Purchase Orders to suppliers and convert fulfilled orders into vendor bills.",
        target: '[data-wizard="inv-po-table"]',
        route: "/invoice/purchase-order",
        nextRoute: "/invoice/payment-queue",
        preferredPosition: "bottom",
        actionText: "Payment Queue",
        actionType: "navigate",
        successFeedback: "PO Issued ✓",
      },
      {
        id: "payment-queue",
        title: "Process in Payment Queue",
        description: "Review due dates, approve vendor bills, and record disbursements.",
        target: '[data-wizard="inv-payment-table"]',
        route: "/invoice/payment-queue",
        preferredPosition: "bottom",
        actionText: "Next",
        successFeedback: "Payment recorded ✓",
      },
      {
        id: "chart-of-accounts",
        title: "Financial Ledger Sync",
        description: "All payments and vendor bills automatically update the General Ledger.",
        target: '[data-wizard="inv-nav-chart-of-accounts"]',
        route: "/invoice/chart-of-account",
        preferredPosition: "bottom",
        actionText: "Got it",
      },
    ],
  },

  "inventory": {
    moduleId: "inventory",
    moduleName: "Inventory",
    rootRoute: "/inventory/operation/incoming_product",
    invitationTitle: "New to Inventory?",
    invitationText: "Learn how to receive shipments, monitor stock on hand, and track site consumption.",
    completionTitle: "Inventory Overview Complete",
    completionText: "Stock levels are updated across locations and site consumption is synced.",
    nextModule: {
      name: "Project Costing",
      route: "/project-costing",
    },
    steps: [
      {
        id: "incoming-products",
        title: "Receive Incoming Goods",
        description: "Accept and validate physical items delivered against issued Purchase Orders.",
        target: '[data-wizard="inventory-incoming-table"]',
        route: "/inventory/operation/incoming_product",
        nextRoute: "/inventory/operation/material-consumption",
        preferredPosition: "bottom",
        actionText: "Consumption",
        actionType: "navigate",
        successFeedback: "Shipment validated ✓",
      },
      {
        id: "material-consumption",
        title: "Log Material Consumption",
        description: "Record materials used on-site and deduct quantities from warehouse stock.",
        target: '[data-wizard="inventory-consumption-table"]',
        route: "/inventory/operation/material-consumption",
        nextRoute: "/inventory/stock-on-hand",
        preferredPosition: "bottom",
        actionText: "Stock on Hand",
        actionType: "navigate",
        successFeedback: "Consumption recorded ✓",
      },
      {
        id: "stock-on-hand",
        title: "Check Stock on Hand",
        description: "Monitor real-time inventory balances, warehouse sites, and total valuation.",
        target: '[data-wizard="inventory-stock-table"]',
        route: "/inventory/stock-on-hand",
        nextRoute: "/inventory/stocks/adjustment",
        preferredPosition: "bottom",
        actionText: "Adjustments",
        actionType: "navigate",
      },
      {
        id: "stock-adjustments",
        title: "Adjustments & Stock Moves",
        description: "Perform physical stock counts or audit the complete movement ledger.",
        target: '[data-wizard="inventory-adjustments-table"]',
        route: "/inventory/stocks/adjustment",
        preferredPosition: "bottom",
        actionText: "Got it",
      },
    ],
  },
};
