"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";
import {
  useGetDashboardCountsQuery,
  useGetDashboardFinancialSummaryQuery,
  useGetDashboardProjectChartQuery,
} from "@/api/dashboardApi";
import type { DashboardProjectChartItem } from "@/types/dashboard";
import { useGetPurchaseOrdersQuery } from "@/api/purchase/purchaseOrderApi";
import { useGetPurchaseOrdersQuery as useGetProjectPurchaseOrdersQuery } from "@/api/invoice/projectPurchaseOrdersApi";
import { useGetVendorBillsQuery } from "@/api/invoice/vendorBillsApi";
import { useGetProjectRequestsQuery } from "@/api/requests/projectRequestApi";
import { useGetStockOnHandListQuery } from "@/api/inventory/stockOnHandApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import {
  ShoppingCart,
  FileText,
  AlertTriangle,
  Wallet,
  MapPin,
  Package,
  ChevronRight,
  TrendingUp,
  Clock,
  Plus,
  Calendar,
  Layers,
  X,
  Filter,
  Download,
  Building2,
  Check,
  ArrowRight,
  ChevronDown,
  Search,
  Eye,
  CreditCard,
  RefreshCw,
  Box,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
  Copy,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// DATA DEFINITIONS & INITIAL STATE
// ---------------------------------------------------------------------------

interface SiteRequest {
  id: string;
  title: string;
  project: string;
  requestedBy: string;
  date: string;
  amount: string;
  amountNum: number;
  category: "Material" | "Labor" | "Equipment" | "Petty cash";
  status: "Pending" | "Approved" | "Rejected";
  items: { desc: string; qty: number; unit: string; rate: string; total: string }[];
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  vendorEmail: string;
  vendorPhone: string;
  amount: string;
  amountNum: number;
  status: "Draft" | "Sent" | "Partially Received" | "Received";
  statusStyle: string;
  date: string;
  project: string;
  wbsCode: string;
  items: { desc: string; qty: number; rate: string; total: string }[];
}

interface Invoice {
  id: string;
  vendor: string;
  vendorBank: string;
  accountNumber: string;
  dueDate: string;
  amount: string;
  amountNum: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  statusStyle: string;
  project: string;
  paidAmount: string;
  balance: string;
  items: { desc: string; qty: number; rate: string; total: string }[];
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitCost: string;
  totalValue: string;
  status: "Normal" | "Low Stock" | "Critical";
  location: string;
}

interface BudgetWBS {
  code: string;
  name: string;
  allocated: string;
  spent: string;
  committed: string;
  available: string;
  utilization: number;
}

interface ProjectData {
  id: string;
  name: string;
  client: string;
  manager: string;
  poValue: string;
  poCount: number;
  poTrend: string;
  totalInvoiced: string;
  paidAmount: string;
  overdueAmount: string;
  overdueCount: number;
  hasOverdue: boolean;
  budgetUtilization: number;
  allocatedBudget: string;
  totalBudget: string;
  siteRequestsCount: number;
  siteRequestsPending: number;
  inventoryAlerts: number;
  monthlySpending: string;
  monthlyTotalRequests: number;
  monthlyApprovedRequests: number;
  monthlyRejectedRequests: number;
  categorySpend: { name: string; value: number; color: string; amount: string }[];
  barData: {
    project: string;
    fullName: string;
    budget: number;
    spent: number;
    budgetFormatted: string;
    spentFormatted: string;
  }[];
  monthlyTrends: {
    month: string;
    budget: number;
    committed: number;
    actual: number;
  }[];
  siteRequests: SiteRequest[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  inventoryItems: InventoryItem[];
  budgetWBS: BudgetWBS[];
  incomingProductsCount?: number;
  activeProjectsCount?: number;
}

const INITIAL_PROJECTS: Record<string, ProjectData> = {
  all: {
    id: "all",
    name: "All Active Projects",
    client: "All Clients",
    manager: "Portfolio Operations",
    poValue: "₦0.00",
    poCount: 0,
    poTrend: "",
    totalInvoiced: "₦0.00",
    paidAmount: "₦0.00",
    overdueAmount: "₦0.00",
    overdueCount: 0,
    hasOverdue: false,
    budgetUtilization: 0,
    allocatedBudget: "₦0.00",
    totalBudget: "₦0.00",
    siteRequestsCount: 0,
    siteRequestsPending: 0,
    inventoryAlerts: 0,
    incomingProductsCount: 0,
    activeProjectsCount: 0,
    monthlySpending: "₦0.00",
    monthlyTotalRequests: 0,
    monthlyApprovedRequests: 0,
    monthlyRejectedRequests: 0,
    categorySpend: [],
    barData: [],
    monthlyTrends: [],
    siteRequests: [],
    purchaseOrders: [],
    invoices: [],
    inventoryItems: [],
    budgetWBS: [],
  },
};



function formatNaira(num: number): string {
  if (num >= 1000000000) {
    return `₦${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `₦${(num / 1000000).toFixed(1)}M`;
  }
  return `₦${num.toLocaleString()}`;
}

function parseAndFormatCurrency(val: any, fallback: string): string {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") return formatNaira(val);
  if (typeof val === "string") {
    if (val.startsWith("₦") || val.startsWith("$")) return val;
    const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
    if (!isNaN(num)) return formatNaira(num);
  }
  return String(val);
}

function extractCount(val: any, fallback: number = 0): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof val === "object" && val !== null) {
    if (typeof val.active === "number") return val.active;
    if (typeof val.total === "number") return val.total;
    if (typeof val.count === "number") return val.count;
    if (typeof val.pending === "number") return val.pending;
    if (typeof val.unreceived === "number") return val.unreceived;
  }
  return fallback;
}

function matchesPeriod(rawDate: any, period: string): boolean {
  if (!period || period === "all_time" || period === "all") return true;
  if (!rawDate || rawDate === "N/A") return true;

  let d: Date;
  if (rawDate instanceof Date) {
    d = rawDate;
  } else {
    const cleaned = String(rawDate).replace(/^due\s+/i, "").trim();
    d = new Date(cleaned);
  }

  if (isNaN(d.getTime())) return true;

  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan ... 8 = Sep

  switch (period) {
    case "current":
      return year === 2026 && month === 8;
    case "last":
      return year === 2026 && month === 7;
    case "q3":
    case "q3_2026":
      return year === 2026 && month >= 6 && month <= 8;
    case "ytd":
    case "ytd_2026":
      return year === 2026;
    default:
      return true;
  }
}

function matchesProject(
  itemProject: string | undefined,
  selectedProjectName: string,
  selectedProjectId: string
): boolean {
  if (!selectedProjectId || selectedProjectId === "all") return true;
  if (!itemProject) return true;

  const itemLower = itemProject.toLowerCase().trim();
  const nameLower = (selectedProjectName || "").toLowerCase().trim();
  const idLower = (selectedProjectId || "").toLowerCase().trim();

  if (itemLower === nameLower || itemLower === idLower) return true;
  if (nameLower && (itemLower.includes(nameLower) || nameLower.includes(itemLower))) return true;

  return false;
}

function renderBudgetBar(props: any) {
  const { x, y, width, height, value } = props;
  if (x === undefined || y === undefined || width === undefined) return null;
  const numVal = typeof value === "number" ? value : parseFloat(String(value || 0)) || 0;
  const isZero = numVal <= 0;
  const minH = 6;
  const actualHeight = Math.max(Math.abs(Number(height) || 0), minH);
  const actualY = (Number(height) || 0) < minH ? y - minH : y;

  return (
    <g>
      <rect
        x={x}
        y={actualY}
        width={width}
        height={actualHeight}
        fill={isZero ? "#BFDBFE" : "#3B82F6"}
        stroke={isZero ? "#2563EB" : "none"}
        strokeWidth={isZero ? 1 : 0}
        strokeDasharray={isZero ? "2 2" : undefined}
        rx={isZero ? 2 : 4}
        ry={isZero ? 2 : 4}
      />
      {isZero && (
        <text
          x={x + width / 2}
          y={actualY - 4}
          textAnchor="middle"
          fill="#2563EB"
          fontSize={10}
          fontWeight={700}
        >
          ₦0
        </text>
      )}
    </g>
  );
}

function renderSpentBar(props: any) {
  const { x, y, width, height, value } = props;
  if (x === undefined || y === undefined || width === undefined) return null;
  const numVal = typeof value === "number" ? value : parseFloat(String(value || 0)) || 0;
  const isZero = numVal <= 0;
  const minH = 6;
  const actualHeight = Math.max(Math.abs(Number(height) || 0), minH);
  const actualY = (Number(height) || 0) < minH ? y - minH : y;

  return (
    <g>
      <rect
        x={x}
        y={actualY}
        width={width}
        height={actualHeight}
        fill={isZero ? "#86EFAC" : "#22C55E"}
        stroke={isZero ? "#16A34A" : "none"}
        strokeWidth={isZero ? 1 : 0}
        strokeDasharray={isZero ? "2 2" : undefined}
        rx={isZero ? 2 : 4}
        ry={isZero ? 2 : 4}
      />
      {isZero && (
        <text
          x={x + width / 2}
          y={actualY - 4}
          textAnchor="middle"
          fill="#16A34A"
          fontSize={10}
          fontWeight={700}
        >
          ₦0
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);


  // Live Dashboard & Module Queries (Zero Dummy Data)
  const {
    data: countsData,
    isLoading: isCountsLoading,
    isFetching: isCountsFetching,
    refetch: refetchCounts,
  } = useGetDashboardCountsQuery();

  const {
    data: financialData,
    isLoading: isFinancialLoading,
    isFetching: isFinancialFetching,
    refetch: refetchFinancial,
  } = useGetDashboardFinancialSummaryQuery();

  const {
    data: projectChartData,
    isLoading: isProjectChartLoading,
    isFetching: isProjectChartFetching,
    refetch: refetchProjectChart,
  } = useGetDashboardProjectChartQuery();

  const {
    data: purchaseOrdersData,
    isLoading: isPOsLoading,
    isFetching: isPOsFetching,
    refetch: refetchPOs,
  } = useGetPurchaseOrdersQuery({});

  const {
    data: projectPOsData,
    isLoading: isProjectPOsLoading,
    isFetching: isProjectPOsFetching,
    refetch: refetchProjectPOs,
  } = useGetProjectPurchaseOrdersQuery({});

  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    refetch: refetchInvoices,
  } = useGetVendorBillsQuery();

  const {
    data: projectRequestsData,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    refetch: refetchRequests,
  } = useGetProjectRequestsQuery({});

  const {
    data: stockOnHandData,
    isLoading: isStockLoading,
    isFetching: isStockFetching,
    refetch: refetchStock,
  } = useGetStockOnHandListQuery();

  const {
    data: costingProjectsData,
    isLoading: isCostingProjectsLoading,
    isFetching: isCostingProjectsFetching,
    refetch: refetchCostingProjects,
  } = useGetProjectCostingProjectsQuery({});

  const isDataLoading =
    isCountsLoading ||
    isFinancialLoading ||
    isProjectChartLoading ||
    isPOsLoading ||
    isProjectPOsLoading ||
    isInvoicesLoading ||
    isCostingProjectsLoading;
  const isDataFetching =
    isCountsFetching ||
    isFinancialFetching ||
    isProjectChartFetching ||
    isPOsFetching ||
    isProjectPOsFetching ||
    isInvoicesFetching ||
    isCostingProjectsFetching;

  const showSkeleton = !isMounted || isDataLoading;

  const handleRefreshAll = () => {
    refetchCounts();
    refetchFinancial();
    refetchProjectChart();
    refetchCostingProjects();
    refetchPOs();
    refetchProjectPOs();
    refetchInvoices();
    refetchRequests();
    refetchStock();
  };

  // Transform Live Real Purchase Orders (combining project POs and standard POs)
  const livePurchaseOrders: PurchaseOrder[] = useMemo(() => {
    const projectList: any[] = Array.isArray(projectPOsData)
      ? projectPOsData
      : (projectPOsData as any)?.results || [];
    const standardList: any[] = Array.isArray(purchaseOrdersData)
      ? purchaseOrdersData
      : (purchaseOrdersData as any)?.results || [];

    const rawCombined = [...projectList, ...standardList];
    const seenIds = new Set<string>();
    const normalized: PurchaseOrder[] = [];

    rawCombined.forEach((po: any) => {
      const rawId = String(po.po_number || po.order_number || po.id || "");
      if (!rawId || seenIds.has(rawId)) return;
      seenIds.add(rawId);

      const amt =
        parseFloat(
          po.total_amount || po.po_total_price || po.total_price || 0
        ) || 0;

      const rawStatus = String(po.status || "draft").toLowerCase().trim();
      let st: "Draft" | "Sent" | "Partially Received" | "Received" = "Draft";
      if (rawStatus === "draft") {
        st = "Draft";
      } else if (
        ["sent", "issued", "approved", "submitted", "awaiting"].includes(rawStatus)
      ) {
        st = "Sent";
      } else if (
        ["partially_received", "partial", "partially received"].includes(rawStatus)
      ) {
        st = "Partially Received";
      } else if (
        [
          "received",
          "fully_received",
          "fully received",
          "completed",
          "closed",
          "fully_billed",
        ].includes(rawStatus)
      ) {
        st = "Received";
      }

      const stStyle =
        st === "Draft"
          ? "bg-gray-100 text-gray-700 border-gray-200"
          : st === "Sent"
          ? "bg-blue-50 text-[#3B7CED] border-blue-200"
          : st === "Partially Received"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";

      const dateVal = po.created_at || po.date_created || po.created_on;
      const formattedDate = dateVal
        ? new Date(dateVal).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      const proj =
        po.project_name ||
        po.project ||
        po.project_details?.name ||
        po.project_details?.project_name ||
        po.project_costing_name ||
        po.wbs_element_details?.phase?.project_name ||
        po.wbs_element_details?.phase?.name ||
        po.wbs_element_details?.name ||
        "General";

      const wbs =
        po.wbs_code ||
        po.wbs_element_details?.name ||
        po.wbs_element ||
        "N/A";

      const vendor =
        po.vendor_name ||
        po.vendor_details?.company_name ||
        po.vendor_details?.vendor_name ||
        po.vendor_details?.name ||
        "Vendor";

      const itemsList = Array.isArray(po.lines)
        ? po.lines.map((it: any) => ({
            desc: it.description || it.item_name || "Item",
            qty: Number(it.qty || it.quantity || 1),
            rate: formatNaira(parseFloat(it.unit_price || 0) || 0),
            total: formatNaira(
              parseFloat(
                it.line_total ||
                  (Number(it.qty || it.quantity || 1) *
                    parseFloat(it.unit_price || 0)) ||
                  0
              )
            ),
          }))
        : Array.isArray(po.items)
        ? po.items.map((it: any) => ({
            desc: it.product_details?.product_name || it.desc || "Item",
            qty: Number(it.qty || 1),
            rate: formatNaira(
              parseFloat(it.estimated_unit_price || it.rate || 0) || 0
            ),
            total: formatNaira(
              parseFloat(it.total_price || it.total || 0) || 0
            ),
          }))
        : [];

      normalized.push({
        id: rawId,
        vendor,
        vendorEmail: po.vendor_details?.email || "",
        vendorPhone: po.vendor_details?.phone_number || "",
        amount: formatNaira(amt),
        amountNum: amt,
        status: st,
        statusStyle: stStyle,
        date: formattedDate,
        project: proj,
        wbsCode: String(wbs),
        items: itemsList,
      });
    });

    return normalized;
  }, [projectPOsData, purchaseOrdersData]);

  // Transform Live Real Invoices / Vendor Bills
  const liveInvoices: Invoice[] = useMemo(() => {
    const list: any[] = Array.isArray(invoicesData)
      ? invoicesData
      : (invoicesData as any)?.results || [];
    return list.map((inv: any) => {
      const amt = parseFloat(inv.total_amount || inv.amount || 0) || 0;
      const paid = parseFloat(inv.amount_paid || inv.paid_amount || 0) || 0;
      const bal = parseFloat(inv.balance || amt - paid || 0) || 0;
      const rawStatus = inv.status ? String(inv.status).toLowerCase() : "draft";
      const st =
        rawStatus === "paid"
          ? "Paid"
          : rawStatus === "sent" || rawStatus === "submitted" || rawStatus === "approved"
          ? "Sent"
          : rawStatus === "overdue"
          ? "Overdue"
          : "Draft";
      const stStyle =
        st === "Paid"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : st === "Sent"
          ? "bg-blue-50 text-[#3B7CED] border-blue-200"
          : st === "Overdue"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-gray-100 text-[#525F7F] border-gray-200";
      return {
        id: String(inv.bill_number || inv.invoice_number || inv.id || "INV"),
        vendor:
          (inv.vendor_details as any)?.company_name ||
          (inv.vendor_details as any)?.vendor_name ||
          inv.vendor_name ||
          "Vendor",
        vendorBank: inv.bank_name || "Corporate Bank",
        accountNumber: inv.account_number || "",
        dueDate: inv.due_date
          ? `due ${new Date(inv.due_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`
          : "N/A",
        amount: formatNaira(amt),
        amountNum: amt,
        status: st as any,
        statusStyle: stStyle,
        project: inv.project_details?.name || inv.project_name || "General",
        paidAmount: formatNaira(paid),
        balance: formatNaira(bal),
        items: Array.isArray(inv.lines)
          ? inv.lines.map((it: any) => ({
              desc: it.description || it.desc || "Item",
              qty: Number(it.quantity || it.qty) || 1,
              rate: formatNaira(parseFloat(it.rate || it.unit_price || 0) || 0),
              total: formatNaira(
                parseFloat(it.total || 0) ||
                  (Number(it.quantity || 1) * parseFloat(it.unit_price || 0))
              ),
            }))
          : Array.isArray(inv.items)
          ? inv.items.map((it: any) => ({
              desc: it.description || it.desc || "Item",
              qty: Number(it.quantity || it.qty) || 1,
              rate: formatNaira(parseFloat(it.rate || it.unit_price || 0) || 0),
              total: formatNaira(parseFloat(it.total || 0) || 0),
            }))
          : [],
      };
    });
  }, [invoicesData]);

  // Transform Live Real Project Requests
  const liveSiteRequests: SiteRequest[] = useMemo(() => {
    const list: any[] = Array.isArray(projectRequestsData)
      ? projectRequestsData
      : (projectRequestsData as any)?.results || [];
    return list.map((req: any) => {
      const amt =
        parseFloat(
          req.total_amount || req.amount || req.detail?.total_amount || 0
        ) || 0;
      const rawStatus = req.status ? String(req.status).toLowerCase() : "pending";
      const st =
        rawStatus === "approved"
          ? "Approved"
          : rawStatus === "rejected"
          ? "Rejected"
          : "Pending";
      const rawType = req.request_type ? String(req.request_type).toLowerCase() : "material";
      const cat =
        rawType === "labor" || rawType === "labour"
          ? "Labor"
          : rawType === "equipment" || rawType === "plant_equipment"
          ? "Equipment"
          : rawType === "petty_cash"
          ? "Petty cash"
          : "Material";
      return {
        id: String(req.reference_id || req.id || "REQ"),
        title: req.title || req.detail?.title || `${cat} Request`,
        project: req.project_details?.name || "General",
        requestedBy: req.created_by_details
          ? `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim()
          : "Staff Member",
        date: req.created_at
          ? new Date(req.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        amount: formatNaira(amt),
        amountNum: amt,
        category: cat,
        status: st as any,
        items: Array.isArray(req.detail?.items)
          ? req.detail.items.map((it: any) => ({
              desc: it.description || it.desc || "Item",
              qty: Number(it.quantity || it.qty) || 1,
              unit: it.unit || "Units",
              rate: formatNaira(parseFloat(it.unit_price || it.rate || 0) || 0),
              total: formatNaira(parseFloat(it.total || 0) || 0),
            }))
          : [],
      };
    });
  }, [projectRequestsData]);

  // Transform Live Real Stock On Hand Alerts
  const liveInventoryItems: InventoryItem[] = useMemo(() => {
    const list: any[] = Array.isArray(stockOnHandData)
      ? stockOnHandData
      : (stockOnHandData as any)?.results || [];
    return list.map((item: any) => {
      const qty = Number(item.quantity || item.available_quantity || 0);
      const reorder = Number(item.reorder_level || item.minimum_quantity || 10);
      const cost = parseFloat(item.unit_cost || item.cost_price || 0) || 0;
      const st = qty <= 0 ? "Critical" : qty < reorder ? "Low Stock" : "Normal";
      return {
        id: String(item.id || item.product || "ITEM"),
        name: item.product_name || item.product_details?.name || "Product",
        sku: item.sku || item.product_details?.sku || "SKU",
        category: item.category_name || item.product_details?.category || "Inventory",
        quantity: qty,
        unit: item.unit_of_measure_name || "Units",
        reorderLevel: reorder,
        unitCost: formatNaira(cost),
        totalValue: formatNaira(qty * cost),
        status: st,
        location: item.location_name || item.stock_location_details?.name || "Warehouse",
      };
    });
  }, [stockOnHandData]);
  const [allProjectsData, setAllProjectsData] = useState<Record<string, ProjectData>>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all_time");
  const [chartView, setChartView] = useState<"projects" | "monthly">("projects");

  // Filters
  const [poFilter, setPoFilter] = useState<string>("all");
  const [invFilter, setInvFilter] = useState<string>("all");
  const [invoicePeriodFilter, setInvoicePeriodFilter] = useState<string>("all");
  const [monthlyRangeFilter, setMonthlyRangeFilter] = useState<string>("all");

  // Drawers & Modals
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSiteRequestsDrawerOpen, setIsSiteRequestsDrawerOpen] = useState(false);
  const [isInventoryDrawerOpen, setIsInventoryDrawerOpen] = useState(false);
  const [isBudgetDrawerOpen, setIsBudgetDrawerOpen] = useState(false);

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    code: "",
    manager: "",
    client: "",
    type: "Fixed Price",
    budget: "",
    startDate: "2026-10-01",
    endDate: "2027-04-30",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const apiProjectList: DashboardProjectChartItem[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(projectChartData)) list = projectChartData;
    else if (Array.isArray((projectChartData as any)?.projects)) list = (projectChartData as any).projects;
    else if (Array.isArray((projectChartData as any)?.results)) list = (projectChartData as any).results;

    if (list.length > 0) {
      return list.map((p) => ({
        id: p.id,
        name: p.name || p.project_name || `Project ${p.id}`,
        budget: typeof p.budget === "number" ? p.budget : parseFloat(String(p.budget || p.total_budget || 0)) || 0,
        actual_spent: typeof p.actual_spent === "number" ? p.actual_spent : parseFloat(String(p.actual_spent || p.spent || 0)) || 0,
      }));
    }

    const costingList: any[] = Array.isArray(costingProjectsData)
      ? costingProjectsData
      : (costingProjectsData as any)?.results || [];

    if (costingList.length > 0) {
      return costingList.map((p) => {
        const b =
          p.financials?.budget ??
          p.budget ??
          p.total_budget ??
          p.contract_amount ??
          0;
        const s =
          p.financials?.actual_spent ??
          p.actual_spent ??
          p.spent ??
          0;
        return {
          id: p.id,
          name: p.name || p.project_name || `Project ${p.id}`,
          budget: typeof b === "number" ? b : parseFloat(String(b)) || 0,
          actual_spent: typeof s === "number" ? s : parseFloat(String(s)) || 0,
        };
      });
    }

    return [];
  }, [projectChartData, costingProjectsData]);

  const projectOptions = useMemo(() => {
    const options = [{ id: "all", label: "All Projects" }];
    if (apiProjectList.length > 0) {
      apiProjectList.forEach((p) => {
        options.push({
          id: String(p.id),
          label: p.name,
        });
      });
    } else {
      Object.keys(allProjectsData)
        .filter((k) => k !== "all")
        .forEach((k) => {
          options.push({ id: k, label: allProjectsData[k].name });
        });
    }
    return options;
  }, [allProjectsData, apiProjectList]);

  const currentProject = useMemo(() => {
    const baseProject = allProjectsData[selectedProjectId] || allProjectsData["all"];

    // 1. If user selected a specific project
    if (selectedProjectId !== "all" && apiProjectList.length > 0) {
      const apiProj = apiProjectList.find(
        (p) => String(p.id) === selectedProjectId
      );
      if (apiProj) {
        const bNum = typeof apiProj.budget === "number" ? apiProj.budget : (parseFloat(String(apiProj.budget)) || 0);
        let sNum = typeof apiProj.actual_spent === "number" ? apiProj.actual_spent : (parseFloat(String(apiProj.actual_spent)) || 0);

        const projName = apiProj.name;
        const projId = String(apiProj.id);

        const projPOs = livePurchaseOrders.filter((po) =>
          matchesProject(po.project, projName, projId)
        );
        const projInvoices = liveInvoices.filter((inv) =>
          matchesProject(inv.project, projName, projId)
        );
        const projRequests = liveSiteRequests.filter((req) =>
          matchesProject(req.project, projName, projId)
        );
        const projInventory = liveInventoryItems.filter((item) =>
          matchesProject(item.location, projName, projId)
        );

        const projPoTotal = projPOs.reduce((sum, p) => sum + p.amountNum, 0);
        const projInvTotal = projInvoices.reduce((sum, i) => sum + i.amountNum, 0);
        const projPaidTotal = projInvoices
          .filter((i) => i.status === "Paid")
          .reduce((sum, i) => sum + i.amountNum, 0);
        const projOverdueInvoices = projInvoices.filter((i) => i.status === "Overdue");
        const projOverdueAmount = projOverdueInvoices.reduce((sum, i) => sum + i.amountNum, 0);

        if (sNum === 0) {
          if (projPaidTotal > 0) {
            sNum = projPaidTotal;
          } else if (projPoTotal > 0) {
            sNum = projPoTotal;
          }
        }
        const util = bNum > 0 ? Math.min(100, Math.round((sNum / bNum) * 100)) : 0;

        return {
          ...baseProject,
          id: projId,
          name: projName,
          poValue: formatNaira(projPoTotal),
          poCount: projPOs.length,
          poTrend: projPOs.length > 0 ? `${projPOs.length} active` : "0 active",
          totalInvoiced: formatNaira(projInvTotal),
          paidAmount: formatNaira(projPaidTotal),
          overdueAmount: formatNaira(projOverdueAmount),
          overdueCount: projOverdueInvoices.length,
          hasOverdue: projOverdueInvoices.length > 0,
          totalBudget: formatNaira(bNum),
          allocatedBudget: formatNaira(bNum),
          budgetUtilization: util,
          siteRequestsCount: projRequests.length,
          siteRequestsPending: projRequests.filter((r) => r.status === "Pending").length,
          inventoryAlerts: projInventory.filter((it) => it.status !== "Normal").length,
          incomingProductsCount: projInventory.length,
          activeProjectsCount: 1,
          monthlySpending: formatNaira(sNum),
          purchaseOrders: projPOs,
          invoices: projInvoices,
          siteRequests: projRequests,
          inventoryItems: projInventory,
          barData: [
            {
              project: projName.length > 15 ? projName.slice(0, 12) + "..." : projName,
              fullName: projName,
              budget: bNum,
              spent: sNum,
              budgetFormatted: formatNaira(bNum),
              spentFormatted: formatNaira(sNum),
            },
          ],
        };
      }
    }

    // 2. When "all" (Portfolio) is selected, merge live API counts, financial metrics, and real records
    if (selectedProjectId === "all") {
      let apiBarData: any[] = [];
      let totalBudgetFromProjects = 0;
      let totalSpentFromProjects = 0;

      if (apiProjectList.length > 0) {
        apiBarData = apiProjectList.map((p) => {
          const bNum = typeof p.budget === "number" ? p.budget : (parseFloat(String(p.budget)) || 0);
          let sNum = typeof p.actual_spent === "number" ? p.actual_spent : (parseFloat(String(p.actual_spent)) || 0);

          if (sNum === 0) {
            const projInvoices = liveInvoices.filter((inv) =>
              matchesProject(inv.project, p.name, String(p.id))
            );
            const projPOs = livePurchaseOrders.filter((po) =>
              matchesProject(po.project, p.name, String(p.id))
            );
            const projPaidTotal = projInvoices
              .filter((i) => i.status === "Paid")
              .reduce((sum, i) => sum + i.amountNum, 0);
            const projPoTotal = projPOs.reduce((sum, po) => sum + po.amountNum, 0);

            if (projPaidTotal > 0) {
              sNum = projPaidTotal;
            } else if (projPoTotal > 0) {
              sNum = projPoTotal;
            }
          }

          totalBudgetFromProjects += bNum;
          totalSpentFromProjects += sNum;
          return {
            project: p.name.length > 15 ? p.name.slice(0, 12) + "..." : p.name,
            fullName: p.name,
            budget: bNum,
            spent: sNum,
            budgetFormatted: formatNaira(bNum),
            spentFormatted: formatNaira(sNum),
          };
        });
      }

      const calculatedUtilization =
        totalBudgetFromProjects > 0
          ? Math.min(100, Math.round((totalSpentFromProjects / totalBudgetFromProjects) * 100))
          : 0;

      const overdueCnt = extractCount(
        financialData?.overdue_invoice?.count ??
          countsData?.vendor_bills?.overdue ??
          countsData?.overdue_invoices ??
          countsData?.overdue_count,
        liveInvoices.filter((i) => i.status === "Overdue").length
      );

      const totalPoSum = livePurchaseOrders.reduce((sum, p) => sum + p.amountNum, 0);
      const totalInvSum = liveInvoices.reduce((sum, i) => sum + i.amountNum, 0);

      const poTotalVal =
        financialData?.purchase_orders?.total_value ??
        financialData?.po_value ??
        financialData?.poValue ??
        financialData?.total_po_value;

      const totalInvoicedVal =
        financialData?.invoices?.total_invoiced ??
        financialData?.total_invoiced ??
        financialData?.totalInvoiced ??
        financialData?.invoiced_amount;

      const totalPaidVal =
        financialData?.invoices?.total_paid ??
        financialData?.paid_amount ??
        financialData?.paidAmount ??
        financialData?.total_paid;

      const overdueAmountVal =
        financialData?.overdue_invoice?.total_value ??
        financialData?.overdue_amount ??
        financialData?.overdueAmount;

      const totalBudgetVal =
        financialData?.project_costing?.total_budget ??
        financialData?.total_budget ??
        financialData?.totalBudget;

      const actualSpentVal =
        financialData?.project_costing?.actual_spent ??
        financialData?.monthly_spending ??
        financialData?.monthlySpending;

      const budgetUtil =
        typeof financialData?.project_costing?.spent_percentage === "number"
          ? Math.round(financialData.project_costing.spent_percentage)
          : financialData?.budget_utilization ??
            financialData?.budgetUtilization ??
            calculatedUtilization;

      const totalPaidSum = liveInvoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amountNum, 0);
      const totalOverdueSum = liveInvoices.filter((i) => i.status === "Overdue").reduce((sum, i) => sum + i.amountNum, 0);

      return {
        ...baseProject,
        poValue: (poTotalVal && parseFloat(String(poTotalVal)) > 0)
          ? parseAndFormatCurrency(poTotalVal, "₦0.00")
          : totalPoSum > 0 ? formatNaira(totalPoSum) : "₦0.00",
        poCount: extractCount(
          countsData?.purchase_orders ??
            countsData?.purchase_orders_count ??
            countsData?.po_count ??
            financialData?.po_count,
          livePurchaseOrders.length
        ),
        totalInvoiced: (totalInvoicedVal && parseFloat(String(totalInvoicedVal)) > 0)
          ? parseAndFormatCurrency(totalInvoicedVal, "₦0.00")
          : totalInvSum > 0 ? formatNaira(totalInvSum) : "₦0.00",
        paidAmount: (totalPaidVal && parseFloat(String(totalPaidVal)) > 0)
          ? parseAndFormatCurrency(totalPaidVal, "₦0.00")
          : totalPaidSum > 0 ? formatNaira(totalPaidSum) : "₦0.00",
        overdueAmount: (overdueAmountVal && parseFloat(String(overdueAmountVal)) > 0)
          ? parseAndFormatCurrency(overdueAmountVal, "₦0.00")
          : totalOverdueSum > 0 ? formatNaira(totalOverdueSum) : "₦0.00",
        overdueCount: overdueCnt,
        hasOverdue: overdueCnt > 0,
        budgetUtilization: budgetUtil > 0 ? budgetUtil : 0,
        totalBudget: (totalBudgetVal && parseFloat(String(totalBudgetVal)) > 0)
          ? parseAndFormatCurrency(totalBudgetVal, "₦0.00")
          : totalBudgetFromProjects > 0 ? formatNaira(totalBudgetFromProjects) : "₦0.00",
        allocatedBudget: (totalBudgetVal && parseFloat(String(totalBudgetVal)) > 0)
          ? parseAndFormatCurrency(totalBudgetVal, "₦0.00")
          : totalBudgetFromProjects > 0 ? formatNaira(totalBudgetFromProjects) : "₦0.00",
        siteRequestsCount: extractCount(
          countsData?.project_requests?.total ??
            countsData?.site_requests ??
            countsData?.site_requests_count ??
            countsData?.total_requests,
          liveSiteRequests.length
        ),
        siteRequestsPending: extractCount(
          countsData?.project_requests?.pending ??
            countsData?.site_requests_pending ??
            countsData?.pending_requests,
          liveSiteRequests.filter((r) => r.status === "Pending").length
        ),
        inventoryAlerts: extractCount(
          countsData?.incoming_products?.unreceived ??
            countsData?.inventory_alerts ??
            countsData?.inventoryAlerts,
          liveInventoryItems.filter((it) => it.status !== "Normal").length
        ),
        incomingProductsCount: extractCount(
          countsData?.incoming_products?.total,
          liveInventoryItems.length
        ),
        activeProjectsCount: extractCount(
          countsData?.project_costing?.active,
          apiProjectList.length
        ),
        monthlySpending: (actualSpentVal && parseFloat(String(actualSpentVal)) > 0)
          ? parseAndFormatCurrency(actualSpentVal, "₦0.00")
          : totalSpentFromProjects > 0 ? formatNaira(totalSpentFromProjects) : "₦0.00",
        barData: apiBarData,
        purchaseOrders: livePurchaseOrders,
        invoices: liveInvoices,
        siteRequests: liveSiteRequests,
        inventoryItems: liveInventoryItems,
      };
    }

    return {
      ...baseProject,
      purchaseOrders: livePurchaseOrders,
      invoices: liveInvoices,
      siteRequests: liveSiteRequests,
      inventoryItems: liveInventoryItems,
    };
  }, [
    allProjectsData,
    selectedProjectId,
    countsData,
    financialData,
    apiProjectList,
    livePurchaseOrders,
    liveInvoices,
    liveSiteRequests,
    liveInventoryItems,
  ]);

  // Filtered POs (by status and period)
  const filteredPOs = useMemo(() => {
    return currentProject.purchaseOrders.filter((po) => {
      if (!matchesPeriod(po.date, selectedPeriod)) return false;

      if (poFilter === "all") return true;
      const f = poFilter.toLowerCase();
      const s = po.status.toLowerCase();
      if (f === "draft") return s === "draft";
      if (f === "sent") return s === "sent";
      if (f === "received") return s === "received" || s === "partially received";
      return s.includes(f);
    });
  }, [currentProject.purchaseOrders, poFilter, selectedPeriod]);

  // Filtered Invoices (by status and period)
  const filteredInvoices = useMemo(() => {
    return currentProject.invoices.filter((inv) => {
      if (!matchesPeriod(inv.dueDate, selectedPeriod)) return false;

      if (invFilter === "all") return true;
      return inv.status.toLowerCase() === invFilter.toLowerCase();
    });
  }, [currentProject.invoices, invFilter, selectedPeriod]);

  const currentInvoiceChartData = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    currentProject.invoices.forEach((inv) => {
      const st = inv.status.toLowerCase();
      if (st === "paid") counts.paid++;
      else if (st === "sent") counts.sent++;
      else if (st === "overdue") counts.overdue++;
      else counts.draft++;
    });

    const hasAny = counts.draft > 0 || counts.sent > 0 || counts.paid > 0 || counts.overdue > 0;

    // Clockwise order with startAngle=90, endAngle=-270 matching screenshot:
    // 1. draft (top-right, blue #3B82F6)
    // 2. overdue (bottom-right, amber/orange #F59E0B)
    // 3. paid (bottom-left, red #EF4444)
    // 4. sent (top-left, green #22C55E)
    if (hasAny) {
      return [
        { name: "draft", value: counts.draft, color: "#3B82F6" },
        { name: "overdue", value: counts.overdue, color: "#F59E0B" },
        { name: "paid", value: counts.paid, color: "#EF4444" },
        { name: "sent", value: counts.sent, color: "#22C55E" },
      ].filter((d) => d.value > 0);
    }

    return [];
  }, [currentProject.invoices]);

  const invoiceBreakdown = useMemo(() => {
    const total = currentProject.invoices.length || 1;
    const counts: Record<string, { count: number; color: string; filterKey: string }> = {
      draft: { count: 0, color: "#3B82F6", filterKey: "draft" },
      sent: { count: 0, color: "#22C55E", filterKey: "sent" },
      paid: { count: 0, color: "#EF4444", filterKey: "paid" },
      overdue: { count: 0, color: "#F59E0B", filterKey: "overdue" },
    };

    currentProject.invoices.forEach((inv) => {
      const st = inv.status.toLowerCase();
      if (st === "paid") counts.paid.count++;
      else if (st === "sent") counts.sent.count++;
      else if (st === "overdue") counts.overdue.count++;
      else counts.draft.count++;
    });

    return Object.entries(counts).map(([label, info]) => ({
      label,
      count: info.count,
      color: info.color,
      filterKey: info.filterKey,
      percent: currentProject.invoices.length > 0 ? Math.round((info.count / total) * 100) : 0,
    }));
  }, [currentProject]);

  const filteredMonthlyTrends = useMemo(() => {
    if (monthlyRangeFilter === "h1") return currentProject.monthlyTrends.slice(0, 6);
    if (monthlyRangeFilter === "q3") return currentProject.monthlyTrends.slice(6, 9);
    return currentProject.monthlyTrends;
  }, [currentProject, monthlyRangeFilter]);

  const barChartMax = useMemo(() => {
    const allBudgetsAndSpent = currentProject.barData.map((d) => Math.max(d.budget, d.spent));
    const maxVal = allBudgetsAndSpent.length > 0 ? Math.max(...allBudgetsAndSpent, 100000000) : 600000000;

    let step = 150000000;
    if (maxVal > 1000000000) {
      step = 250000000;
    } else if (maxVal > 500000000) {
      step = 200000000;
    } else {
      step = 150000000;
    }

    return Math.max(Math.ceil(maxVal / step) * step, step * 4);
  }, [currentProject.barData]);

  const barChartTicks = useMemo(() => {
    const step = barChartMax / 4;
    return [0, step, step * 2, step * 3, barChartMax];
  }, [barChartMax]);

  // Handler: Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.name.trim()) return;

    const newKey = `proj_${Date.now()}`;
    const cleanBudgetNum = parseFloat(newProjectForm.budget.replace(/[^0-9.]/g, "")) || 0;
    const formattedBudget = formatNaira(cleanBudgetNum);

    const newProjObj: ProjectData = {
      id: newKey,
      name: newProjectForm.name,
      client: newProjectForm.client || "Fastra Enterprise Client",
      manager: newProjectForm.manager || "Lead Project Engineer",
      poValue: "₦0.0M",
      poCount: 0,
      poTrend: "New",
      totalInvoiced: "₦0.0M",
      paidAmount: "₦0.0M",
      overdueAmount: "₦0.0M",
      overdueCount: 0,
      hasOverdue: false,
      budgetUtilization: 0,
      allocatedBudget: "₦0.0M",
      totalBudget: formattedBudget,
      siteRequestsCount: 0,
      siteRequestsPending: 0,
      inventoryAlerts: 0,
      monthlySpending: "₦0",
      monthlyTotalRequests: 0,
      monthlyApprovedRequests: 0,
      monthlyRejectedRequests: 0,
      categorySpend: [
        { name: "Purchase", value: 0, color: "#3B7CED", amount: "₦0" },
        { name: "Labor", value: 0, color: "#1E3A8A", amount: "₦0" },
        { name: "Material", value: 0, color: "#0F172A", amount: "₦0" },
      ],
      barData: [
        {
          project: newProjectForm.name.slice(0, 12) + "...",
          fullName: newProjectForm.name,
          budget: cleanBudgetNum,
          spent: 0,
          budgetFormatted: formattedBudget,
          spentFormatted: "₦0.0M",
        },
      ],
      monthlyTrends: [
        { month: "Oct", budget: cleanBudgetNum / 1000, committed: 0, actual: 0 },
      ],
      siteRequests: [],
      purchaseOrders: [],
      invoices: [],
      inventoryItems: [],
      budgetWBS: [
        {
          code: "WBS-1.0",
          name: "Phase 1 Mobilization & Setup",
          allocated: formattedBudget,
          spent: "₦0",
          committed: "₦0",
          available: formattedBudget,
          utilization: 0,
        },
      ],
    };

    setAllProjectsData((prev) => ({
      ...prev,
      [newKey]: newProjObj,
    }));

    setSelectedProjectId(newKey);
    setIsNewProjectOpen(false);
    setNewProjectForm({
      name: "",
      code: "",
      manager: "",
      client: "",
      type: "Fixed Price",
      budget: "",
      startDate: "2026-10-01",
      endDate: "2027-04-30",
    });
  };

  // Handler: Site Request status update (Approve/Reject)
  const handleUpdateRequestStatus = (reqId: string, newStatus: "Approved" | "Rejected") => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const reqIdx = proj.siteRequests.findIndex((r) => r.id === reqId);
        if (reqIdx !== -1) {
          const req = proj.siteRequests[reqIdx];
          const oldStatus = req.status;
          req.status = newStatus;
          if (oldStatus === "Pending") {
            proj.siteRequestsPending = Math.max(0, proj.siteRequestsPending - 1);
            if (newStatus === "Approved") {
              proj.monthlyApprovedRequests += 1;
            } else {
              proj.monthlyRejectedRequests += 1;
            }
          }
        }
      });
      return updated;
    });
  };

  // Handler: Invoice payment approval / marking as paid
  const handleMarkInvoicePaid = (invId: string) => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const inv = proj.invoices.find((i) => i.id === invId);
        if (inv) {
          const prevStatus = inv.status;
          inv.status = "Paid";
          inv.statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
          inv.paidAmount = inv.amount;
          inv.balance = "₦0";
          if (prevStatus === "Overdue") {
            proj.overdueCount = Math.max(0, proj.overdueCount - 1);
            proj.hasOverdue = proj.overdueCount > 0;
            proj.overdueAmount = proj.overdueCount > 0 ? proj.overdueAmount : "₦0.0M";
          }
        }
      });
      return updated;
    });
    setSelectedInv(null);
  };

  // Handler: PO Mark as Received
  const handleMarkPoReceived = (poId: string) => {
    setAllProjectsData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const proj = updated[k];
        const po = proj.purchaseOrders.find((p) => p.id === poId);
        if (po) {
          po.status = "Received";
          po.statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
      });
      return updated;
    });
    setSelectedPo(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FE] font-open-sans text-[#32325D] select-none">
      <NavBar title="Home" items={[]} />
      <main className="flex-1 pb-16">

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================================================================= */}
        {/* HEADER: Clean Dashboard Title & Overview Subtitle with Refresh Action */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Project costing overview across all active modules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAll}
              disabled={isDataFetching}
              title="Refresh all metrics from live backend"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60 active:scale-95 group"
            >
              <RefreshCw
                size={13}
                className={`text-gray-400 group-hover:text-gray-600 transition-transform ${
                  isDataFetching ? "animate-spin text-[#3B7CED]" : "group-hover:rotate-180 duration-500"
                }`}
              />
              <span>{isDataFetching ? "Updating..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 1: EXECUTIVE KPI CARDS */}
        {/* ================================================================= */}
        {showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-20 bg-gray-200/80 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-gray-100" />
                </div>
                <div className="h-7 w-28 bg-gray-200 rounded my-2" />
                <div className="h-3 w-24 bg-gray-100 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Card 1: PO Value */}
            <div
              onClick={() => {
                setPoFilter("all");
              }}
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  PO VALUE
                </span>
                <div className="w-8 h-8 rounded-lg border border-blue-100 bg-blue-50/40 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
                  <ShoppingCart size={15} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">
                {currentProject.poValue}
              </div>
              <div className="text-xs text-gray-500 mt-2 font-normal">
                {currentProject.poCount} purchase orders
              </div>
            </div>

            {/* Card 2: Total Invoiced */}
            <div
              onClick={() => {
                setInvFilter("all");
              }}
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  TOTAL INVOICED
                </span>
                <div className="w-8 h-8 rounded-lg border border-emerald-100 bg-emerald-50/40 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
                  <FileText size={15} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">
                {currentProject.totalInvoiced}
              </div>
              <div className="text-xs text-gray-500 mt-2 font-normal">
                {currentProject.paidAmount} paid
              </div>
            </div>

            {/* Card 3: Overdue Invoices */}
            <div
              onClick={() => {
                setInvFilter("overdue");
              }}
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-rose-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  OVERDUE INVOICES
                </span>
                <div className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50/40 flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:bg-rose-50 transition-all">
                  <AlertTriangle size={15} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">
                {currentProject.overdueAmount}
              </div>
              <div className="text-xs text-gray-500 mt-2 font-normal">
                {currentProject.overdueCount} overdue
              </div>
            </div>

            {/* Card 4: Budget Utilisation */}
            <div
              onClick={() => setIsBudgetDrawerOpen(true)}
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-amber-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  BUDGET UTILISATION
                </span>
                <div className="w-8 h-8 rounded-lg border border-amber-100 bg-amber-50/40 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-50 transition-all">
                  <Wallet size={15} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">
                {currentProject.budgetUtilization}%
              </div>
              <div className="text-xs text-gray-500 mt-2 font-normal">
                {currentProject.allocatedBudget} of {currentProject.totalBudget}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ROW 2: MODULE QUICK STATUS CARDS */}
        {/* ================================================================= */}
        {showSkeleton ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-pulse flex flex-col justify-between min-h-[115px]"
              >
                <div className="w-5 h-5 rounded-md bg-gray-100" />
                <div className="mt-3 space-y-1.5">
                  <div className="h-6 w-10 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Card 1: Site Requests */}
            <Link
              href="/project-request"
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[115px]"
            >
              <div className="flex items-center justify-between">
                <MapPin size={18} className="text-gray-400 group-hover:text-[#3B7CED] transition-colors" />
                {currentProject.siteRequestsPending > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 animate-pulse">
                    {currentProject.siteRequestsPending}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProject.siteRequestsCount}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Site Requests
                </div>
              </div>
            </Link>

            {/* Card 2: Purchase Orders */}
            <Link
              href="/invoice/purchase-order"
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[115px]"
            >
              <div className="flex items-center justify-between">
                <ShoppingCart size={18} className="text-gray-700 group-hover:text-[#3B7CED] transition-colors" />
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProject.poCount}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Purchase Orders
                </div>
              </div>
            </Link>

            {/* Card 3: Invoices */}
            <Link
              href="/invoice/approved-requests"
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[115px]"
            >
              <div className="flex items-center justify-between">
                <FileText size={18} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProject.invoices.length}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Invoices
                </div>
              </div>
            </Link>

            {/* Card 4: Inventory */}
            <Link
              href="/inventory/operation/incoming_product"
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[115px]"
            >
              <div className="flex items-center justify-between">
                <Box size={18} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
                {currentProject.inventoryAlerts > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 animate-pulse">
                    {currentProject.inventoryAlerts}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProject.incomingProductsCount ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Inventory
                </div>
              </div>
            </Link>

            {/* Card 5: Budgets */}
            <Link
              href="/project-costing"
              className="bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-200 cursor-pointer group col-span-2 sm:col-span-1 flex flex-col justify-between min-h-[115px]"
            >
              <div className="flex items-center justify-between">
                <Wallet size={18} className="text-gray-400 group-hover:text-[#3B7CED] transition-colors" />
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  {currentProject.activeProjectsCount ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Budgets
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ================================================================= */}
        {/* ROW 3: CHARTS (Budget vs Spent by Project & Invoice Status) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Left: Main Bar Chart (Budget vs Spent by Project) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    Budget vs Spent by Project
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Live project financial comparisons · Total Budget: {currentProject.totalBudget} · Total Spent: {currentProject.monthlySpending}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <TrendingUp size={16} className="stroke-[1.75]" />
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-[310px] w-full">
                {showSkeleton ? (
                  <div className="h-full w-full flex items-end justify-around pb-6 pt-10 px-4 animate-pulse">
                    {[55, 35, 75, 45, 90, 60].map((h, idx) => (
                      <div key={idx} className="flex items-end gap-2 h-full">
                        <div style={{ height: `${h}%` }} className="w-7 bg-blue-100/70 rounded-t" />
                        <div style={{ height: `${h * 0.7}%` }} className="w-7 bg-emerald-100/70 rounded-t" />
                      </div>
                    ))}
                  </div>
                ) : currentProject.barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={currentProject.barData}
                      margin={{ top: 25, right: 15, left: 10, bottom: 5 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F9" />
                      <XAxis
                        dataKey="project"
                        tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#8898AA", fontSize: 11, fontFamily: "'Open Sans', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        ticks={barChartTicks}
                        tickFormatter={(val) => {
                          if (val === 0) return "₦0";
                          if (val >= 1000000000) return `₦${(val / 1000000000).toFixed(1)}B`;
                          return `₦${(val / 1000000).toFixed(1)}M`;
                        }}
                        domain={[0, barChartMax]}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#E5E7EB", opacity: 0.5 }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const budgetVal = Number(data.budget || 0);
                            const spentVal = Number(data.spent || 0);
                            const pct = budgetVal > 0 ? ((spentVal / budgetVal) * 100).toFixed(1) : "0.0";
                            return (
                              <div className="bg-white p-3.5 border border-gray-100 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[200px]">
                                <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">
                                  {data.fullName || data.project}
                                </p>
                                <div className="flex items-center justify-between text-[#3B82F6] font-semibold pt-0.5">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                                    Budget:
                                  </span>
                                  <span>₦{budgetVal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#16A34A] font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                                    Spent:
                                  </span>
                                  <span>
                                    ₦{spentVal.toLocaleString()}
                                    <span className="text-[10px] text-gray-400 font-normal ml-1">({pct}%)</span>
                                  </span>
                                </div>
                                {spentVal === 0 && (
                                  <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mt-1">
                                    ₦0.00 actual expenses logged to date
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="budget"
                        name="Budget"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                        minPointSize={6}
                        shape={renderBudgetBar}
                      />
                      <Bar
                        dataKey="spent"
                        name="Spent"
                        fill="#22C55E"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                        minPointSize={6}
                        shape={renderSpentBar}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#3B7CED] mb-2.5 shadow-2xs">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">No Project Budget Comparison</h3>
                    <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                      Active projects with budgets and expense records will automatically appear here as side-by-side comparisons.
                    </p>
                    <Link
                      href="/project-costing"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 text-xs font-semibold text-[#3B7CED] hover:text-[#2d62be] bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span>Open Project Costing</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Centered Bottom Legend */}
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-50 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B82F6]" />
                <span>Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#22C55E]" />
                <span>Spent</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                <span className="w-2 h-2 rounded-full border border-dashed border-[#16A34A] bg-[#86EFAC]" />
                <span>(₦0 indicates 0 expenses logged)</span>
              </div>
            </div>
          </div>

          {/* Right: Invoice Status Donut */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    Invoice Status
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Distribution by settlement stage
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Clock size={16} className="stroke-[1.75]" />
                </div>
              </div>

              {/* Donut Container */}
              <div className="h-[230px] w-full flex items-center justify-center">
                {showSkeleton ? (
                  <div className="w-36 h-36 rounded-full border-[16px] border-gray-100 border-t-blue-200 animate-spin" style={{ animationDuration: "2s" }} />
                ) : currentInvoiceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentInvoiceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {currentInvoiceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val, name) => [`${val} Invoices`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200" />
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex flex-col items-center justify-center">
                        <FileText size={18} className="text-gray-400 mb-0.5" />
                        <span className="text-[10px] font-bold text-gray-500">0</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-800">No Invoices Recorded</p>
                    <p className="text-[11px] text-gray-400 max-w-[200px] mt-0.5 leading-relaxed">
                      Vendor bills will be categorized here.
                    </p>
                    <Link
                      href="/invoice/approved-requests"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B7CED] hover:text-blue-700 mt-2 group"
                    >
                      <span>Browse Bills</span>
                      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Legend matching UI design */}
            <div className="flex items-center justify-center gap-3.5 pt-2 text-xs font-medium text-gray-500 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3B82F6]" />
                <span>draft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#22C55E]" />
                <span>sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#EF4444]" />
                <span>paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F59E0B]" />
                <span>overdue</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 4: RECENT TRANSACTIONS (PO & INVOICES) */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Recent Purchase Orders */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Recent Purchase Orders
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {filteredPOs.length}
                  </span>
                </div>

                {/* Filter Tabs & View all */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg text-[11px] font-medium text-gray-600">
                    {["all", "draft", "sent", "received"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setPoFilter(status)}
                        className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                          poFilter === status
                            ? "bg-white text-gray-900 font-semibold shadow-2xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/invoice/purchase-order"
                    className="text-xs font-semibold text-[#3B7CED] hover:underline whitespace-nowrap ml-1"
                  >
                    View all
                  </Link>
                </div>
              </div>

              {/* PO Rows */}
              {showSkeleton ? (
                <div className="divide-y divide-gray-100 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-5 w-14 bg-gray-100 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPOs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredPOs.slice(0, 4).map((po) => (
                    <div
                      key={po.id}
                      onClick={() => setSelectedPo(po)}
                      className="py-3.5 flex items-center justify-between hover:bg-blue-50/40 hover:pl-3 -mx-2 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-[#3B7CED] transition-colors flex items-center gap-1.5">
                          <span>{po.id}</span>
                          <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#3B7CED]" />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {po.vendor} · {po.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-gray-900">
                          {po.amount}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-transform group-hover:scale-105 ${
                            po.status === "Draft"
                              ? "bg-gray-100 text-gray-700"
                              : po.status === "Sent"
                              ? "bg-blue-50 text-[#3B7CED]"
                              : po.status === "Partially Received"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#3B7CED] mb-2.5 shadow-2xs">
                    <ShoppingCart size={18} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {poFilter === "all" ? "No Purchase Orders Yet" : `No ${poFilter} Purchase Orders`}
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                    {poFilter === "all"
                      ? "Purchase orders created in procurement will be listed here with live status tracking."
                      : `There are currently no purchase orders matching "${poFilter}" status.`}
                  </p>
                  <Link
                    href="/purchase/purchase_requests/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B7CED] hover:text-[#2d62be] mt-3 group"
                  >
                    <Plus size={12} />
                    <span>Create Purchase Order</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Recent Invoices
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {filteredInvoices.length}
                  </span>
                </div>

                {/* Filter Tabs & View all */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-lg text-[11px] font-medium text-gray-600">
                    {["all", "draft", "paid", "overdue"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setInvFilter(status)}
                        className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                          invFilter === status
                            ? "bg-white text-gray-900 font-semibold shadow-2xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/invoice/approved-requests"
                    className="text-xs font-semibold text-[#3B7CED] hover:underline whitespace-nowrap ml-1"
                  >
                    View all
                  </Link>
                </div>
              </div>

              {/* Invoice Rows */}
              {showSkeleton ? (
                <div className="divide-y divide-gray-100 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="py-3.5 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-5 w-14 bg-gray-100 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredInvoices.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredInvoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInv(inv)}
                      className="py-3.5 flex items-center justify-between hover:bg-emerald-50/40 hover:pl-3 -mx-2 px-2 rounded-xl transition-all duration-150 cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-[#3B7CED] transition-colors flex items-center gap-1.5">
                          <span>{inv.id}</span>
                          <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#3B7CED]" />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {inv.vendor} · {inv.dueDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-gray-900">
                          {inv.amount}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-transform group-hover:scale-105 ${
                            inv.status === "Draft"
                              ? "bg-gray-100 text-gray-700"
                              : inv.status === "Sent"
                              ? "bg-blue-50 text-[#3B7CED]"
                              : inv.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {invFilter === "all" ? "No Invoices Recorded" : `No ${invFilter} Invoices`}
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                    {invFilter === "all"
                      ? "Approved vendor bills and subcontractor invoices will appear here."
                      : `There are currently no invoices matching "${invFilter}" status.`}
                  </p>
                  <Link
                    href="/invoice/approved-requests"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-3 group"
                  >
                    <span>Browse Vendor Bills</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 1: PURCHASE ORDER DETAIL */}
      {/* ================================================================= */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#32325D]">
                      {selectedPo.id}
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPo.id);
                      }}
                      title="Copy PO Number"
                      className="p-1 text-gray-400 hover:text-[#32325D] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedPo.statusStyle}`}
                    >
                      {selectedPo.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8898AA] mt-1">
                    Issued on {selectedPo.date} · {selectedPo.project}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPo(null)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Vendor & WBS Info */}
              <div className="bg-[#F8F9FE] p-4 rounded-xl my-4 space-y-2 border border-[#E9ECEF] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Vendor:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedPo.vendor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Contact:</span>
                  <span className="text-[#525F7F]">
                    {selectedPo.vendorEmail} · {selectedPo.vendorPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">WBS Code:</span>
                  <span className="font-semibold text-[#3B7CED]">
                    {selectedPo.wbsCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Project:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedPo.project}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-[#8898AA] uppercase tracking-wider mb-2">
                  Line Items Breakdown
                </h4>
                <div className="border border-[#E9ECEF] rounded-xl divide-y divide-[#E9ECEF]">
                  {selectedPo.items?.map((item: any, i: number) => (
                    <div key={i} className="p-3 text-xs">
                      <div className="font-medium text-[#32325D]">
                        {item.desc}
                      </div>
                      <div className="flex justify-between text-[#8898AA] mt-1">
                        <span>
                          {item.qty} units @ {item.rate}
                        </span>
                        <span className="font-bold text-[#32325D]">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-[#E9ECEF]">
                <span className="text-sm font-semibold text-[#525F7F]">
                  Total Value:
                </span>
                <span className="text-xl font-extrabold text-[#3B7CED]">
                  {selectedPo.amount}
                </span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-6 border-t border-[#E9ECEF] flex items-center gap-3">
              {selectedPo.status !== "Received" && (
                <button
                  onClick={() => handleMarkPoReceived(selectedPo.id)}
                  className="flex-1 bg-[#2BA24D] hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Confirm Goods Received
                </button>
              )}
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FE] hover:bg-gray-200 text-[#32325D] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer border border-[#E9ECEF]"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedPo(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 2: INVOICE DETAIL */}
      {/* ================================================================= */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#32325D]">
                      {selectedInv.id}
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInv.id);
                      }}
                      title="Copy Invoice Number"
                      className="p-1 text-gray-400 hover:text-[#32325D] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedInv.statusStyle}`}
                    >
                      {selectedInv.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8898AA] mt-1">
                    {selectedInv.dueDate} · {selectedInv.project}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInv(null)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedInv.status === "Overdue" && (
                <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#F5365C] flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>
                    Payment deadline exceeded! Vendor reminder issued. Immediate Finance action required.
                  </span>
                </div>
              )}

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-[#F8F9FE] p-3 rounded-xl border border-[#E9ECEF] text-xs">
                  <span className="text-[#8898AA]">Paid Amount:</span>
                  <div className="text-base font-bold text-[#2BA24D] mt-0.5">
                    {selectedInv.paidAmount}
                  </div>
                </div>
                <div className="bg-[#F8F9FE] p-3 rounded-xl border border-[#E9ECEF] text-xs">
                  <span className="text-[#8898AA]">Outstanding Balance:</span>
                  <div className="text-base font-bold text-[#F5365C] mt-0.5">
                    {selectedInv.balance}
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-[#F8F9FE] p-4 rounded-xl mb-4 space-y-2 border border-[#E9ECEF] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Vendor:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedInv.vendor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Bank Details:</span>
                  <span className="text-[#525F7F]">
                    {selectedInv.vendorBank} - {selectedInv.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8898AA]">Due Date:</span>
                  <span className="font-semibold text-[#32325D]">
                    {selectedInv.dueDate}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-bold text-[#8898AA] uppercase tracking-wider mb-2">
                  Invoice Breakdown
                </h4>
                <div className="border border-[#E9ECEF] rounded-xl divide-y divide-[#E9ECEF]">
                  {selectedInv.items?.map((item: any, i: number) => (
                    <div key={i} className="p-3 text-xs">
                      <div className="font-medium text-[#32325D]">
                        {item.desc}
                      </div>
                      <div className="flex justify-between text-[#8898AA] mt-1">
                        <span>Quantity: {item.qty}</span>
                        <span className="font-bold text-[#32325D]">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-6 border-t border-[#E9ECEF] flex items-center gap-3">
              {selectedInv.status !== "Paid" && (
                <button
                  onClick={() => handleMarkInvoicePaid(selectedInv.id)}
                  className="flex-1 bg-[#3B7CED] hover:bg-[#3065c3] text-white py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Approve & Record Payment
                </button>
              )}
              <button
                onClick={() => setSelectedInv(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#525F7F] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 3: SITE REQUESTS FLOW (Approve / Reject Scope) */}
      {/* ================================================================= */}
      {isSiteRequestsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Project Requests
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      {currentProject.name} · {currentProject.siteRequests.length} total requests
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSiteRequestsDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-3">
                {currentProject.siteRequests.length === 0 ? (
                  <div className="text-center py-12 text-[#8898AA] text-xs">
                    No project requests logged for this project.
                  </div>
                ) : (
                  currentProject.siteRequests.map((req) => (
                    <div
                      key={req.id}
                      className="border border-[#E9ECEF] rounded-xl p-4 bg-[#F8F9FE] hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#32325D]">{req.id}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                req.status === "Approved"
                                  ? "bg-emerald-50 text-[#2BA24D] border-emerald-200"
                                  : req.status === "Rejected"
                                  ? "bg-rose-50 text-[#F5365C] border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[#32325D] mt-1">{req.title}</h4>
                          <p className="text-[11px] text-[#8898AA] mt-0.5">
                            By {req.requestedBy} · {req.date}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-[#3B7CED]">{req.amount}</span>
                      </div>

                      {/* Items */}
                      <div className="bg-white rounded-lg p-2.5 border border-[#E9ECEF] divide-y divide-gray-100 text-[11px]">
                        {req.items.map((item, idx) => (
                          <div key={idx} className="py-1 flex justify-between text-[#525F7F]">
                            <span>{item.qty} {item.unit} - {item.desc}</span>
                            <span className="font-semibold text-[#32325D]">{item.total}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons if pending */}
                      {req.status === "Pending" && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, "Rejected")}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#F5365C] font-semibold text-xs rounded-lg transition-colors border border-rose-200 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                            className="px-3 py-1.5 bg-[#2BA24D] hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            Approve Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsSiteRequestsDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Project Requests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 4: INVENTORY WAREHOUSE STOCK PREVIEW */}
      {/* ================================================================= */}
      {isInventoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                    <Package size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Incoming Products & Material Stock
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      Stock on hand across project warehouses
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInventoryDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-3">
                {currentProject.inventoryItems.length === 0 ? (
                  <div className="text-center py-12 text-[#8898AA] text-xs">
                    No incoming products or inventory stock items recorded.
                  </div>
                ) : (
                  currentProject.inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-[#E9ECEF] rounded-xl p-3.5 bg-[#F8F9FE] hover:bg-white transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#32325D]">{item.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                item.status === "Critical"
                                  ? "bg-rose-50 text-[#F5365C] border-rose-200"
                                  : item.status === "Low Stock"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-[#2BA24D] border-emerald-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8898AA] mt-0.5">
                            SKU: {item.sku} · {item.location}
                          </p>
                        </div>
                        <span className="font-bold text-[#32325D]">{item.totalValue}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#525F7F] bg-white p-2 rounded-lg border border-gray-100">
                        <span>Available: <strong className="text-[#32325D]">{item.quantity} {item.unit}</strong></span>
                        <span>Reorder Level: <strong>{item.reorderLevel} {item.unit}</strong></span>
                        <span>Unit Cost: <strong>{item.unitCost}</strong></span>
                      </div>

                      {item.status !== "Normal" && (
                        <div className="flex justify-end pt-1">
                          <Link
                            href="/purchase/purchase_requests/new"
                            className="px-3 py-1 bg-[#3B7CED] hover:bg-[#3065c3] text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Create Restock Request
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsInventoryDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Incoming Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER 5: BUDGET WBS BREAKDOWN */}
      {/* ================================================================= */}
      {isBudgetDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wallet size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#32325D]">
                      Project Costing & WBS Scope
                    </h3>
                    <p className="text-xs text-[#8898AA]">
                      {currentProject.name} · WBS Level Financials
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBudgetDrawerOpen(false)}
                  className="p-1.5 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="my-4 space-y-4">
                {currentProject.budgetWBS.length === 0 ? (
                  <div className="text-center py-12 text-[#8898AA] text-xs">
                    No WBS elements recorded for this project.
                  </div>
                ) : (
                  currentProject.budgetWBS.map((wbs) => (
                    <div
                      key={wbs.code}
                      className="border border-[#E9ECEF] rounded-xl p-4 bg-[#F8F9FE] space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#3B7CED]">{wbs.code}</span>
                          <span className="font-semibold text-[#32325D]">{wbs.name}</span>
                        </div>
                        <span className="font-bold text-[#32325D]">{wbs.utilization}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${wbs.utilization}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            wbs.utilization > 80 ? "bg-amber-500" : "bg-[#3B7CED]"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-[#8898AA] block">Allocated:</span>
                          <span className="font-bold text-[#32325D]">{wbs.allocated}</span>
                        </div>
                        <div>
                          <span className="text-[#8898AA] block">Spent:</span>
                          <span className="font-bold text-[#2BA24D]">{wbs.spent}</span>
                        </div>
                        <div>
                          <span className="text-[#8898AA] block">Committed:</span>
                          <span className="font-bold text-blue-600">{wbs.committed}</span>
                        </div>
                        <div>
                          <span className="text-[#8898AA] block">Available:</span>
                          <span className="font-bold text-[#32325D]">{wbs.available}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={() => setIsBudgetDrawerOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Project Costing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE NEW PROJECT */}
      {/* ================================================================= */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-[#E9ECEF] overflow-hidden animate-in zoom-in-95 duration-150 font-open-sans">
            <div className="flex items-center justify-between p-5 border-b border-[#E9ECEF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] text-[#3B7CED] flex items-center justify-center">
                  <Building2 size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#32325D]">
                    Create New Project
                  </h3>
                  <p className="text-xs text-[#8898AA]">
                    Add a new project to your Costing Dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewProjectOpen(false)}
                className="p-1 text-[#8898AA] hover:text-[#32325D] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#32325D] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Commercial Towers Phase 2"
                  value={newProjectForm.name}
                  onChange={(e) =>
                    setNewProjectForm({ ...newProjectForm, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    placeholder="PRJ-2026-004"
                    value={newProjectForm.code}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, code: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Allocated Budget (₦) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="₦350,000,000"
                    value={newProjectForm.budget}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, budget: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Kolawole Davies"
                    value={newProjectForm.manager}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, manager: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#32325D] mb-1">
                    Contract Type
                  </label>
                  <select
                    value={newProjectForm.type}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, type: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F8F9FE] border border-[#E9ECEF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B7CED] text-xs font-medium text-[#32325D]"
                  >
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Time & Materials">Time & Materials</option>
                    <option value="Cost Plus">Cost Plus</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E9ECEF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#525F7F] font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3B7CED] hover:bg-[#3065c3] text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
