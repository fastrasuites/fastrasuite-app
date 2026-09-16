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
    case "projectrequest":
    case "requests":
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
    case "purchase_order":
    case "rfq":
      return {
        label: "Purchase",
        badgeBg: "bg-[#E8F0FE]",
        badgeText: "text-[#1A73E8]",
        iconBg: "bg-[#E8F0FE]",
        iconColor: "text-[#1A73E8]",
        Icon: ShoppingCart,
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
    case "accounting":
    case "payment":
    case "vendor_bill":
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

    // Check if it is an approval or submission event
    const isApprovalOrSubmission =
      event.includes("approved") ||
      event.includes("submitted") ||
      title.includes("approved") ||
      title.includes("submitted");

    if (isApprovalOrSubmission && masterId) {
      return `/project-request/approve/${masterId}`;
    }

    // Check for specific sub-module creation or status updates
    const isPurchase =
      title.includes("purchase") ||
      message.includes("purchase") ||
      event.includes("purchase");

    const isSubcontractor =
      title.includes("subcontractor") ||
      message.includes("subcontractor") ||
      event.includes("subcontractor");

    const isMaterial =
      title.includes("material") ||
      message.includes("material") ||
      event.includes("material");

    const isLabour =
      title.includes("labour") ||
      message.includes("labour") ||
      event.includes("labour");

    const isPettyCash =
      title.includes("petty") ||
      message.includes("petty") ||
      event.includes("petty");

    const isPlant =
      title.includes("plant") ||
      title.includes("equipment") ||
      message.includes("equipment") ||
      event.includes("equipment") ||
      event.includes("plant");

    if (isPurchase) {
      const targetId = objectId || masterId;
      return `/project-request/purchase-request/${targetId}`;
    }

    if (isSubcontractor) {
      const targetId = objectId || masterId;
      return `/project-request/subcontractor-request/${targetId}`;
    }

    if (isMaterial) {
      const targetId = objectId || masterId;
      return `/project-request/material-consumption-request/${targetId}`;
    }

    if (isLabour) {
      const targetId = masterId || objectId;
      return `/project-request/labour-request/${targetId}`;
    }

    if (isPettyCash) {
      const targetId = masterId || objectId;
      return `/project-request/petty-cash-request/${targetId}`;
    }

    if (isPlant) {
      const targetId = objectId || masterId;
      return `/project-request/plant-equipment-request/${targetId}`;
    }

    // Default fallback for project request
    if (masterId) {
      return `/project-request/approve/${masterId}`;
    }
  }

  // 3. Invoicing / Invoice Routes
  // Backend gives: /invoicing/purchase-orders/1
  // Frontend route: /invoice/purchase-order/1
  if (
    url.startsWith("/invoicing/purchase-orders/") ||
    url.startsWith("/invoice/purchase-orders/") ||
    (mod === "invoice" && (event.includes("purchase_order") || title.includes("purchase order")))
  ) {
    const poMatch = url.match(/\/(?:invoicing|invoice)\/purchase-orders?\/([^\/\s]+)/);
    const poId = poMatch ? poMatch[1] : objectId;
    if (poId) {
      return `/invoice/purchase-order/${poId}`;
    }
    return "/invoice/purchase-order";
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
