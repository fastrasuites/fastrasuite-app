import {
  ClipboardList,
  ShoppingCart,
  Package,
  Receipt,
  Briefcase,
  Settings,
  Bell,
  LucideIcon,
} from "lucide-react";

export interface ModuleConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconColor: string;
  Icon: LucideIcon;
}

export function getModuleConfig(moduleName?: string): ModuleConfig {
  const norm = (moduleName || "").toLowerCase().replace(/[\s-]/g, "_");

  switch (norm) {
    case "project_request":
    case "project_requests":
    case "projectrequest":
    case "projectrequests":
    case "requests":
    case "plant_equipment":
    case "subcontractor":
    case "material_consumption":
    case "labour":
    case "petty_cash":
      return {
        label: "Project Request",
        badgeBg: "bg-[#F3E8FF]",
        badgeText: "text-[#7C3AED]",
        iconBg: "bg-[#F3E8FF]",
        iconColor: "text-[#7C3AED]",
        Icon: ClipboardList,
      };

    case "purchase":
    case "purchase_request":
    case "rfq":
      return {
        label: "Project Request",
        badgeBg: "bg-[#F3E8FF]",
        badgeText: "text-[#7C3AED]",
        iconBg: "bg-[#F3E8FF]",
        iconColor: "text-[#7C3AED]",
        Icon: ClipboardList,
      };

    case "inventory":
    case "stock":
    case "delivery_order":
      return {
        label: "Inventory",
        badgeBg: "bg-[#E2F2E9]",
        badgeText: "text-[#2BA24D]",
        iconBg: "bg-[#E2F2E9]",
        iconColor: "text-[#2BA24D]",
        Icon: Package,
      };

    case "invoice":
    case "invoicing":
    case "accounting":
    case "payment":
    case "vendor_bill":
    case "purchase_order":
    case "purchase_orders":
      return {
        label: "Invoice",
        badgeBg: "bg-[#E6FFFA]",
        badgeText: "text-[#0D9488]",
        iconBg: "bg-[#E6FFFA]",
        iconColor: "text-[#0D9488]",
        Icon: Receipt,
      };

    case "project_costing":
    case "project":
      return {
        label: "Project Costing",
        badgeBg: "bg-[#FFF2CC]",
        badgeText: "text-[#D97706]",
        iconBg: "bg-[#FFF2CC]",
        iconColor: "text-[#D97706]",
        Icon: Briefcase,
      };

    case "settings":
    case "users":
    case "tenant":
      return {
        label: "Settings",
        badgeBg: "bg-[#E9ECEF]",
        badgeText: "text-[#495057]",
        iconBg: "bg-[#E9ECEF]",
        iconColor: "text-[#495057]",
        Icon: Settings,
      };

    default:
      return {
        label: moduleName || "System",
        badgeBg: "bg-[#E8F0FE]",
        badgeText: "text-[#1A73E8]",
        iconBg: "bg-[#E8F0FE]",
        iconColor: "text-[#1A73E8]",
        Icon: Bell,
      };
  }
}

export function formatTimeAgo(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) {
      return "Just now";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function resolveNotificationUrl(notification: {
  action_url?: string;
  module?: string;
  module_display?: string;
  object_id?: string;
  title?: string;
  message?: string;
  event?: string;
}): string {
  let url = notification.action_url || "";

  if (!url) {
    return "#";
  }

  const title = (notification.title || "").toLowerCase();
  const message = (notification.message || "").toLowerCase();
  const event = (notification.event || "").toLowerCase();
  const mod = (notification.module || "").toLowerCase();
  const objectId = notification.object_id ? String(notification.object_id).trim() : "";

  // 1. Project Costing Routes
  // Backend gives: /project-costing/projects/1/budget-adjustments/... or /project-costing/projects/1
  // Frontend route: /project-costing/1
  if (
    url.startsWith("/project-costing/projects/") ||
    url.startsWith("/project-costing/project/") ||
    mod === "project_costing"
  ) {
    const projectMatch = url.match(/\/project-costing\/projects?\/(\d+)/);
    const projId = projectMatch ? projectMatch[1] : objectId;
    if (projId && !isNaN(Number(projId))) {
      return `/project-costing/${projId}`;
    }
  }

  // 2. Project Request Routes
  // Backend gives: /project-requests/9, /project_request/9, /project-request/9
  if (
    url.startsWith("/project_request/") ||
    url.startsWith("/project-requests/") ||
    url.startsWith("/project-request/") ||
    mod === "project_requests" ||
    mod === "project_request"
  ) {
    const idMatch = url.match(/\/(?:project_request|project-requests|project-request)\/(\d+)/);
    const masterId = idMatch ? idMatch[1] : objectId;

    // Check if it is an approval, submission, or rejection event
    const isApprovalSubmissionOrRejection =
      event.includes("approved") ||
      event.includes("submitted") ||
      event.includes("rejected") ||
      title.includes("approved") ||
      title.includes("submitted") ||
      title.includes("rejected");

    if (isApprovalSubmissionOrRejection && masterId) {
      return `/project-request/approve/${masterId}`;
    }

    // If URL already targets a specific sub-module route directly
    if (
      url.includes("/plant-equipment-request/") ||
      url.includes("/purchase-request/") ||
      url.includes("/subcontractor-request/") ||
      url.includes("/material-consumption-request/") ||
      url.includes("/labour-request/") ||
      url.includes("/petty-cash-request/")
    ) {
      return url;
    }

    // For specific sub-module creation/updates where objectId is the specific record ID
    const targetSubId = objectId || masterId;
    if (targetSubId) {
      if (title.includes("purchase") || message.includes("purchase")) {
        return `/project-request/purchase-request/${targetSubId}`;
      }
      if (title.includes("plant") || title.includes("equipment") || message.includes("plant") || message.includes("equipment")) {
        return `/project-request/plant-equipment-request/${targetSubId}`;
      }
      if (title.includes("subcontractor") || message.includes("subcontractor")) {
        return `/project-request/subcontractor-request/${targetSubId}`;
      }
      if (title.includes("material") || title.includes("consumption") || message.includes("material") || message.includes("consumption")) {
        return `/project-request/material-consumption-request/${targetSubId}`;
      }
      if (title.includes("labour") || message.includes("labour")) {
        return `/project-request/labour-request/${targetSubId}`;
      }
      if (title.includes("petty") || message.includes("petty")) {
        return `/project-request/petty-cash-request/${targetSubId}`;
      }
    }

    // Default: Dispatch through /project-request/[id] which dynamically handles
    // draft vs approved/pending status and routes with correct detail IDs
    if (masterId) {
      return `/project-request/${masterId}`;
    }
  }

  // 3. Invoicing / Invoice Routes
  // 3a. Purchase Orders: /invoicing/purchase-orders/1 -> /invoice/purchase-order/1
  if (
    url.startsWith("/invoicing/purchase-orders/") ||
    url.startsWith("/invoice/purchase-orders/") ||
    url.startsWith("/invoicing/purchase-order/") ||
    url.startsWith("/invoice/purchase-order/") ||
    (mod === "invoice" && (event.includes("purchase_order") || title.includes("purchase order")))
  ) {
    const poMatch = url.match(/\/(?:invoicing|invoice)\/purchase-orders?\/([^\/\s]+)/);
    const poId = poMatch ? poMatch[1] : objectId;
    if (poId) {
      return `/invoice/purchase-order/${poId}`;
    }
    return "/invoice/purchase-order";
  }

  // 3b. Vendor Bills: /invoicing/vendor-bills/11 -> /invoice/payment-queue/11
  if (
    url.startsWith("/invoicing/vendor-bills/") ||
    url.startsWith("/invoice/vendor-bills/") ||
    url.startsWith("/invoicing/vendor-bill/") ||
    url.startsWith("/invoice/vendor-bill/") ||
    (mod === "invoice" && (event.includes("vendor_bill") || title.includes("vendor bill") || message.includes("vendor bill")))
  ) {
    const vbMatch = url.match(/\/(?:invoicing|invoice)\/vendor-bills?\/([^\/\s]+)/);
    const vbId = vbMatch ? vbMatch[1] : objectId;
    if (vbId) {
      return `/invoice/payment-queue/${vbId}`;
    }
    return "/invoice/payment-queue";
  }

  // 3c. Disbursements: /invoicing/disbursements/3 -> /invoice/payment-queue/disbursement/3
  if (
    url.startsWith("/invoicing/disbursements/") ||
    url.startsWith("/invoice/disbursements/") ||
    url.startsWith("/invoicing/disbursement/") ||
    url.startsWith("/invoice/disbursement/") ||
    (mod === "invoice" && (event.includes("disbursement") || title.includes("disbursement") || message.includes("disbursement")))
  ) {
    const disMatch = url.match(/\/(?:invoicing|invoice)\/disbursements?\/([^\/\s]+)/);
    const disId = disMatch ? disMatch[1] : objectId;
    if (disId) {
      return `/invoice/payment-queue/disbursement/${disId}`;
    }
    return "/invoice/payment-queue/disbursement";
  }

  // 4. Inventory Routes
  // 4a. Scraps: Backend gives: /inventory/scraps/SCP0001/
  // Frontend route: /inventory/operation/scrap/SCP0001
  if (
    url.includes("/inventory/scraps/") ||
    url.includes("/inventory/scrap/") ||
    (mod === "inventory" && (event.includes("scrap") || title.includes("scrap")))
  ) {
    const scrapMatch = url.match(/\/inventory\/(?:scraps|scrap)\/([^\/\s]+)/);
    const scrapId = scrapMatch ? scrapMatch[1] : objectId;
    if (scrapId) {
      return `/inventory/operation/scrap/${scrapId}`;
    }
    return "/inventory/operation/scrap";
  }

  // 4b. Incoming Products: Backend gives: /inventory/incoming-products/WH/IN/0001/
  // Frontend route: /inventory/operation/incoming_product/${encodeURIComponent(code)}
  if (
    url.includes("/inventory/incoming-products/") ||
    url.includes("/inventory/incoming_product/") ||
    (mod === "inventory" && (event.includes("incoming_product") || title.includes("incoming product")))
  ) {
    const incomingMatch = url.match(/\/inventory\/(?:incoming-products|incoming_product)\/(.+?)(?:\/)?$/);
    const rawCode = incomingMatch ? incomingMatch[1] : objectId;
    if (rawCode) {
      const cleanCode = decodeURIComponent(rawCode).replace(/\/$/, "");
      return `/inventory/operation/incoming_product/${encodeURIComponent(cleanCode)}`;
    }
    return "/inventory/operation";
  }

  // 4c. Stock Adjustments: Backend gives: /inventory/stock-adjustments/STJ0001/
  // Frontend route: /inventory/stocks/adjustment/STJ0001
  if (
    url.includes("/inventory/stock-adjustments/") ||
    url.includes("/inventory/stock-adjustment/") ||
    (mod === "inventory" && (event.includes("stock_adjustment") || title.includes("stock adjustment") || message.includes("stock adjustment")))
  ) {
    const adjMatch = url.match(/\/inventory\/(?:stock-adjustments|stock-adjustment)\/([^\/\s]+)/);
    const adjId = adjMatch ? adjMatch[1] : objectId;
    if (adjId) {
      const cleanId = adjId.replace(/\/$/, "");
      return `/inventory/stocks/adjustment/${cleanId}`;
    }
    return "/inventory/stocks/adjustment";
  }

  // 5. Direct purchase routes
  if (url.startsWith("/purchase_request/")) {
    return url.replace("/purchase_request/", "/purchase/");
  }

  // 6. Fallback for raw API URLs
  if (url.includes("/api/") || url.includes("fastrasuiteapi")) {
    if (mod.includes("project_costing") && objectId) return `/project-costing/${objectId}`;
    if (mod.includes("project_request") && objectId) return `/project-request/approve/${objectId}`;
    if (mod.includes("inventory") && objectId) return `/inventory/operation/${objectId}`;
    if (mod.includes("purchase") && objectId) return `/purchase/${objectId}`;
    if (mod.includes("invoice") && objectId) return `/invoice/purchase-order/${objectId}`;
  }

  return url;
}
