"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Folder,
  CheckSquare,
  TrendingUp,
  X,
  Briefcase,
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
} from "recharts";

import {
  useGetDashboardCountsQuery,
  useGetDashboardFinancialSummaryQuery,
  useGetDashboardProjectChartQuery,
} from "@/api/dashboardApi";
import { useGetProjectRequestsQuery } from "@/api/requests/projectRequestApi";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { usePermission } from "@/hooks/usePermission";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { ModuleLauncherGrid } from "@/components/dashboard/ModuleLauncherGrid";
import { NavBar } from "@/components/shared/TopBar/reusableTopBar";

function formatAxisNaira(val: number): string {
  if (val === 0) return "₦0";
  if (val >= 1_000_000_000) {
    const b = val / 1_000_000_000;
    return `₦${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}k`;
  }
  return `₦${val.toLocaleString()}`;
}

function calculateChartScale(data: { budget: number; spent: number }[]) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.budget || 0, d.spent || 0)), 1000);

  let step: number;
  if (maxVal > 1_000_000_000) {
    step = 250_000_000;
  } else if (maxVal > 400_000_000) {
    step = 250_000_000;
  } else if (maxVal > 100_000_000) {
    step = 50_000_000;
  } else if (maxVal > 20_000_000) {
    step = 10_000_000;
  } else if (maxVal > 1_000_000) {
    step = 1_000_000;
  } else if (maxVal > 200_000) {
    step = 50_000;
  } else if (maxVal > 50_000) {
    step = 25_000;
  } else {
    step = Math.max(100, Math.ceil(maxVal / 4));
  }

  const roundedMax = Math.max(step * 4, Math.ceil(maxVal / step) * step);
  const count = Math.round(roundedMax / step);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(i * step);
  }

  return { max: roundedMax, ticks };
}

interface TransactionRow {
  id: string;
  type: string;
  typeBadgeStyle: string;
  person: string;
  status: string;
  statusBadgeStyle: string;
  value: string;
}

function getTransactionReferenceId(r: any, idx: number): string {
  if (!r) return `PR000${idx + 1}`;

  const isPjrCode = (val: any) => {
    if (!val || typeof val !== "string") return false;
    const s = val.trim().toLowerCase();
    return s.startsWith("pjr");
  };

  // 1. Direct reference_id if present and not a PjR project code
  if (r.reference_id && typeof r.reference_id === "string" && !isPjrCode(r.reference_id)) {
    return r.reference_id.trim();
  }

  // 2. Parse detail JSON if present
  let detail: any = {};
  if (r.detail) {
    if (typeof r.detail === "string") {
      try {
        detail = JSON.parse(r.detail);
      } catch {
        detail = {};
      }
    } else {
      detail = r.detail;
    }
  }

  const specificCandidates = [
    detail?.reference_id,
    detail?.request_id,
    detail?.purchase_order_id,
    detail?.purchase_id,
    detail?.petty_cash_id,
    detail?.subcontractor_id,
    detail?.plant_equipment_id,
    detail?.labour_id,
    r.request_reference_id,
  ];

  for (const cand of specificCandidates) {
    if (cand && typeof cand === "string" && cand.trim() && !isPjrCode(cand)) {
      return cand.trim();
    }
  }

  // 3. Fallback to formatted ID or string ID
  if (r.id != null) {
    const num = Number(r.id);
    if (!isNaN(num) && num > 0) {
      return `PR${String(num).padStart(4, "0")}`;
    }
    return String(r.id);
  }

  return "-";
}

function getTransactionAmount(r: any): number {
  if (r?.total_amount != null && Number(r.total_amount) > 0) {
    return Number(r.total_amount);
  }
  if (r?.amount != null && Number(r.amount) > 0) {
    return Number(r.amount);
  }

  let detail: any = {};
  if (r?.detail) {
    if (typeof r.detail === "string") {
      try {
        detail = JSON.parse(r.detail);
      } catch {
        detail = {};
      }
    } else {
      detail = r.detail;
    }
  }

  if (detail?.total_amount != null && Number(detail.total_amount) > 0) {
    return Number(detail.total_amount);
  }
  if (detail?.project_request?.request_amount != null && Number(detail.project_request.request_amount) > 0) {
    return Number(detail.project_request.request_amount);
  }
  if (detail?.amount != null && Number(detail.amount) > 0) {
    return Number(detail.amount);
  }
  if (detail?.amount_requested != null && Number(detail.amount_requested) > 0) {
    return Number(detail.amount_requested);
  }
  if (detail?.pr_total_price != null && Number(detail.pr_total_price) > 0) {
    return Number(detail.pr_total_price);
  }

  return 0;
}

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isAdmin, can, isLoading: isPermissionLoading } = usePermission();
  const { hasAccess, canDo } = useModulePermissions();

  const hasProjectCostingAccess =
    isAdmin ||
    hasAccess("projectCosting") ||
    can({ module: "project_costing", entitlement: "view_project" });

  const canCreateProject =
    isAdmin ||
    can({ module: "project_costing", entitlement: "create_project" }) ||
    canDo("projectCosting", "manager") ||
    canDo("projectCosting", "administrator");

  // RTK Queries - skip if user cannot access project costing to avoid 403 API errors
  const { data: countsData } = useGetDashboardCountsQuery(undefined, {
    skip: !hasProjectCostingAccess,
    refetchOnMountOrArgChange: false,
  });
  const { data: financialData } = useGetDashboardFinancialSummaryQuery(undefined, {
    skip: !hasProjectCostingAccess,
    refetchOnMountOrArgChange: false,
  });
  const { data: projectChartData } = useGetDashboardProjectChartQuery(undefined, {
    skip: !hasProjectCostingAccess,
    refetchOnMountOrArgChange: false,
  });
  const { data: projectRequestsData } = useGetProjectRequestsQuery(
    {},
    { skip: !hasProjectCostingAccess, refetchOnMountOrArgChange: false }
  );
  const { data: projectCostingProjects } = useGetProjectCostingProjectsQuery(
    {},
    { skip: !hasProjectCostingAccess, refetchOnMountOrArgChange: false }
  );

  // KPI Calculations
  const activeProjectsCount = useMemo(() => {
    if (countsData?.project_costing?.active != null) {
      return countsData.project_costing.active;
    }
    if (financialData?.project_costing?.active_projects != null) {
      return financialData.project_costing.active_projects;
    }
    if (Array.isArray(projectCostingProjects)) {
      return projectCostingProjects.filter((p: any) => (p.status || "").toUpperCase() === "ACTIVE").length;
    }
    return 0;
  }, [countsData, financialData, projectCostingProjects]);

  const projectOwnersCount = useMemo(() => {
    return financialData?.project_costing?.project_owners_count ?? 1;
  }, [financialData]);

  const budgetDisplay = useMemo(() => {
    if (financialData?.project_costing?.total_budget != null) {
      const val = Number(financialData.project_costing.total_budget);
      return formatAxisNaira(val);
    }
    return "₦0";
  }, [financialData]);

  const actualSpentDisplay = useMemo(() => {
    if (financialData?.project_costing?.actual_spent != null) {
      const val = Number(financialData.project_costing.actual_spent);
      return formatAxisNaira(val);
    }
    return "₦0";
  }, [financialData]);

  const spentPercentageDisplay = useMemo(() => {
    if (financialData?.project_costing?.spent_percentage != null) {
      return `${Number(financialData.project_costing.spent_percentage).toFixed(1)}%`;
    }
    const b = Number(financialData?.project_costing?.total_budget || 0);
    const s = Number(financialData?.project_costing?.actual_spent || 0);
    if (b > 0) {
      return `${((s / b) * 100).toFixed(1)}%`;
    }
    return "0.0%";
  }, [financialData]);

  const committedAmount = useMemo(() => {
    const pc = financialData?.project_costing;
    return Number(pc?.total_committed ?? pc?.committed ?? 0);
  }, [financialData]);

  const totalCommittedDisplay = useMemo(() => {
    return formatAxisNaira(committedAmount);
  }, [committedAmount]);

  const committedPercentageDisplay = useMemo(() => {
    const pc = financialData?.project_costing;
    if (pc?.committed_percentage != null) {
      return `${Number(pc.committed_percentage).toFixed(1)}%`;
    }
    const b = Number(pc?.total_budget || 0);
    if (b > 0 && committedAmount > 0) {
      return `${((committedAmount / b) * 100).toFixed(1)}%`;
    }
    return "0.0%";
  }, [financialData, committedAmount]);

  // Monthly Spending Metrics
  const monthlySpendingMonth = useMemo(() => {
    return financialData?.monthly_spending?.month || "October 2026";
  }, [financialData]);

  const monthlySpendingTotalValue = useMemo(() => {
    const val = Number(financialData?.monthly_spending?.total_value || 0);
    return formatAxisNaira(val);
  }, [financialData]);

  const monthlyTotalRequests = financialData?.monthly_spending?.total_requests ?? 0;
  const monthlyApprovedRequests = financialData?.monthly_spending?.approved ?? 0;
  const monthlyRejectedRequests = financialData?.monthly_spending?.rejected ?? 0;

  // Project Chart data
  const barChartData = useMemo(() => {
    let apiList: any[] = [];
    if (projectChartData) {
      if (Array.isArray(projectChartData)) {
        apiList = projectChartData;
      } else if (Array.isArray((projectChartData as any)?.projects)) {
        apiList = (projectChartData as any).projects;
      } else if (Array.isArray((projectChartData as any)?.results)) {
        apiList = (projectChartData as any).results;
      }
    }

    const sourceList = apiList;

    return sourceList.slice(0, 5).map((p: any) => {
      const fullName = p.name || p.project_name || "Project";
      let shortName = fullName;
      if (shortName.length > 15) {
        shortName = shortName.slice(0, 13) + "...";
      }

      return {
        id: p.id,
        project: shortName,
        fullName: fullName,
        budget: Number(p.budget || p.total_budget || 0),
        spent: Number(p.actual_spent ?? p.spent ?? p.committed ?? 0),
      };
    });
  }, [projectChartData]);

  // Dynamic Scale & Ticks for Y-Axis
  const chartScale = useMemo(() => {
    return calculateChartScale(barChartData);
  }, [barChartData]);

  // Dynamic Category Spend Data
  const categoryData = useMemo(() => {
    const breakdown = financialData?.category_breakdown;
    if (Array.isArray(breakdown) && breakdown.length > 0) {
      const colors: Record<string, string> = {
        purchase: "#F59E0B",
        labor: "#2563EB",
        labour: "#2563EB",
        petty_cash: "#16A34A",
        subcontractor: "#EF4444",
        material: "#1E293B",
        plant_equipment: "#8B5CF6",
      };
      const defaultColors = ["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#1E293B", "#8B5CF6"];

      const hasAnySpend = breakdown.some((b) => Number(b.amount || b.percentage || 0) > 0);
      if (hasAnySpend) {
        return breakdown
          .filter((item) => Number(item.amount || item.percentage || 0) > 0)
          .map((item: any, idx: number) => {
            const normKey = String(item.name || "").toLowerCase().replace(/[\s-]+/g, "_");
            let val = Number(item.percentage || 0);
            if (val > 0 && val <= 1) {
              val = Math.round(val * 100);
            } else {
              val = Math.round(val);
            }
            return {
              name: item.name || "Category",
              value: val,
              amount: Number(item.amount || 0),
              color: colors[normKey] || defaultColors[idx % defaultColors.length],
            };
          });
      }
    }

    // Fallback: Calculate from project requests if available
    const requests = Array.isArray(projectRequestsData)
      ? projectRequestsData
      : (projectRequestsData as any)?.results || [];
    if (requests.length > 0) {
      const catTotals: Record<string, number> = {};
      let total = 0;
      requests.forEach((r: any) => {
        const type = (r.request_type || "Other").toLowerCase();
        const amt = getTransactionAmount(r);
        if (amt > 0) {
          catTotals[type] = (catTotals[type] || 0) + amt;
          total += amt;
        }
      });
      if (total > 0) {
        const colors: Record<string, string> = {
          purchase: "#F59E0B",
          labor: "#2563EB",
          labour: "#2563EB",
          petty_cash: "#16A34A",
          subcontractor: "#EF4444",
          material: "#1E293B",
          plant_equipment: "#8B5CF6",
        };
        return Object.entries(catTotals).map(([type, amt], idx) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
          value: Math.round((amt / total) * 100),
          amount: amt,
          color: colors[type] || ["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#1E293B", "#8B5CF6"][idx % 6],
        }));
      }
    }
    return [];
  }, [financialData, projectRequestsData]);

  const pendingRequestsList = useMemo(() => {
    const list: any[] = Array.isArray(projectRequestsData)
      ? projectRequestsData
      : (projectRequestsData as any)?.results || [];
    return list.filter((r: any) => {
      const s = (r.status || "").toLowerCase();
      return (
        s === "pending" ||
        s === "awaiting" ||
        s.includes("pending") ||
        s.includes("awaiting")
      );
    });
  }, [projectRequestsData]);

  const pendingRequestsCount = useMemo(() => {
    if (countsData?.project_requests?.pending != null) {
      return countsData.project_requests.pending;
    }
    return pendingRequestsList.length;
  }, [countsData, pendingRequestsList]);

  // Request Transactions
  const requestTransactions = useMemo(() => {
    const list: any[] = Array.isArray(projectRequestsData)
      ? projectRequestsData
      : (projectRequestsData as any)?.results || [];

    return list.slice(0, 4).map((r: any, idx: number) => {
      const rawType = (r.request_type || "Purchase").toLowerCase();
      let typeBadgeStyle = "bg-[#DCFCE7] text-[#16A34A]";
      let displayType = "Purchase";
      if (rawType.includes("labor") || rawType.includes("labour")) {
        typeBadgeStyle = "bg-[#DBEAFE] text-[#2563EB]";
        displayType = "Labor";
      } else if (rawType.includes("petty")) {
        typeBadgeStyle = "bg-[#F3E8FF] text-[#9333EA]";
        displayType = "Petty Cash";
      } else if (rawType.includes("sub") || rawType.includes("contract")) {
        typeBadgeStyle = "bg-[#FEF3C7] text-[#D97706]";
        displayType = "Subcontractor";
      }

      const rawStatus = (r.status || "Draft").toLowerCase();
      let statusBadgeStyle = "bg-[#DBEAFE] text-[#2563EB]";
      let displayStatus = "Draft";
      if (rawStatus === "pending") {
        statusBadgeStyle = "bg-[#FEF3C7] text-[#D97706]";
        displayStatus = "Pending";
      } else if (rawStatus === "approved") {
        statusBadgeStyle = "bg-[#DCFCE7] text-[#16A34A]";
        displayStatus = "Approved";
      }

      const amt = getTransactionAmount(r);
      const refId = getTransactionReferenceId(r, idx);

      return {
        id: refId,
        type: displayType,
        typeBadgeStyle,
        person: r.created_by_details
          ? `${r.created_by_details.first_name || ""} ${r.created_by_details.last_name || ""}`.trim() || r.created_by_details.username || "-"
          : r.created_by_name || "-",
        status: displayStatus,
        statusBadgeStyle,
        value: amt > 0
          ? `₦${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "₦0.00",
      };
    });
  }, [projectRequestsData]);

  // Approved Transactions
  const approvedTransactions = useMemo(() => {
    const list: any[] = Array.isArray(projectRequestsData)
      ? projectRequestsData.filter((r: any) => (r.status || "").toLowerCase() === "approved")
      : [];

    return list.slice(0, 4).map((r: any, idx: number) => {
      const rawType = (r.request_type || "Purchase").toLowerCase();
      let typeBadgeStyle = "bg-[#DCFCE7] text-[#16A34A]";
      let displayType = "Purchase";
      if (rawType.includes("labor") || rawType.includes("labour")) {
        typeBadgeStyle = "bg-[#DBEAFE] text-[#2563EB]";
        displayType = "Labor";
      } else if (rawType.includes("petty")) {
        typeBadgeStyle = "bg-[#F3E8FF] text-[#9333EA]";
        displayType = "Petty Cash";
      } else if (rawType.includes("sub") || rawType.includes("contract")) {
        typeBadgeStyle = "bg-[#FEF3C7] text-[#D97706]";
        displayType = "Subcontractor";
      }

      const amt = getTransactionAmount(r);
      const refId = getTransactionReferenceId(r, idx);

      return {
        id: refId,
        type: displayType,
        typeBadgeStyle,
        person: r.approved_by_details
          ? `${r.approved_by_details.first_name || ""} ${r.approved_by_details.last_name || ""}`.trim() || r.approved_by_details.username || "-"
          : r.approved_by_name || "-",
        status: "Approved",
        statusBadgeStyle: "bg-[#DCFCE7] text-[#16A34A]",
        value: amt > 0
          ? `₦${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "₦0.00",
      };
    });
  }, [projectRequestsData]);

  if (isPermissionLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]" />
        <p className="mt-4 text-xs text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  // If the user does not have permission on project costing (and is not an admin),
  // show the module launcher grid of all their available module cards instead of an access denied page
  if (!hasProjectCostingAccess) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
        <NavBar title="Dashboard" items={[]} />
        <div className="flex-1 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Available Modules
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                Select an available module to get started
              </p>
            </div>
          </div>

          <ModuleLauncherGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
      <NavBar title="Dashboard" items={[]} />
      <div className="flex-1 text-gray-900 font-sans p-6 sm:p-8 space-y-6">
        {/* ================================================================= */}
        {/* HEADER: Subtitle, and New Project Action Button */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Project Analytics
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
              Overview of all projects and financial activity
            </p>
          </div>
          {canCreateProject && (
            <div>
              <Link
                href="/project-costing/new"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
              >
                New Project
              </Link>
            </div>
          )}
        </div>

      {/* ================================================================= */}
      {/* ROW 1: 5 METRIC CARDS */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: ACTIVE PROJECTS */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              ACTIVE PROJECTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm">
              <Briefcase className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {activeProjectsCount}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              Across {projectOwnersCount} project owner{projectOwnersCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Card 2: BUDGET */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              BUDGET
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#9333EA] flex items-center justify-center">
              <Folder className="w-4 h-4 text-[#9333EA] fill-[#9333EA]/10" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {budgetDisplay}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              Approved portfolio budget
            </div>
          </div>
        </div>

        {/* Card 3: ACTUAL SPENT */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              ACTUAL SPENT
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center">
              <Folder className="w-4 h-4 text-[#16A34A] fill-[#16A34A]/10" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {actualSpentDisplay}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              {spentPercentageDisplay} of total budget
            </div>
          </div>
        </div>

        {/* Card 4: SPENT PERCENTAGE */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              SPENT PERCENTAGE
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {spentPercentageDisplay}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              {budgetDisplay} allocated
            </div>
          </div>
        </div>

        {/* Card 5: TOTAL COMMITTED */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-4 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              TOTAL COMMITTED
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#9333EA] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#9333EA]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
              {totalCommittedDisplay}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              {committedPercentageDisplay} of total budget
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ROW 2: MONTHLY SPENDING & PENDING APPROVALS */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Monthly Spending */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-base font-bold text-gray-900">
                  Monthly Spending
                </h2>
              </div>
              <span className="text-xs sm:text-sm text-gray-400 font-normal">
                {monthlySpendingMonth}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-bold text-[#2563EB]">
                {monthlySpendingTotalValue}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 mb-5 font-normal">
                Total value of requests raised this month
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Total Requests */}
            <div className="bg-[#EFF6FF] rounded-xl py-4 px-3 text-center">
              <div className="text-2xl font-bold text-[#2563EB]">
                {monthlyTotalRequests}
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#2563EB] mt-0.5">
                Total Requests
              </div>
            </div>

            {/* Approved */}
            <div className="bg-[#ECFDF5] rounded-xl py-4 px-3 text-center">
              <div className="text-2xl font-bold text-[#16A34A]">
                {monthlyApprovedRequests}
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#16A34A] mt-0.5">
                Approved
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-[#FFF1F2] rounded-xl py-4 px-3 text-center">
              <div className="text-2xl font-bold text-[#E11D48]">
                {monthlyRejectedRequests}
              </div>
              <div className="text-xs sm:text-sm font-medium text-[#E11D48] mt-0.5">
                Rejected
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pending Requests */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
                <h2 className="text-base font-bold text-gray-900">
                  Pending Requests
                </h2>
              </div>
              <Link
                href="/project-request/approve"
                className="text-xs text-gray-400 hover:text-gray-600 font-normal transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-bold text-[#F59E0B]">
                {pendingRequestsCount}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 mb-5 font-normal">
                Requests awaiting decision
              </p>
            </div>
          </div>

          {pendingRequestsList.length > 0 ? (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {pendingRequestsList.slice(0, 3).map((req: any, idx: number) => {
                const refId = getTransactionReferenceId(req, idx);
                const amt = getTransactionAmount(req);
                const rawType = (req.request_type || "Request").toLowerCase();
                let displayType = "Purchase";
                if (rawType.includes("labor") || rawType.includes("labour")) {
                  displayType = "Labor";
                } else if (rawType.includes("petty")) {
                  displayType = "Petty Cash";
                } else if (rawType.includes("sub") || rawType.includes("contract")) {
                  displayType = "Subcontractor";
                } else if (rawType.includes("plant") || rawType.includes("equipment")) {
                  displayType = "Equipment";
                } else if (rawType.includes("material")) {
                  displayType = "Material";
                }
                const requester = req.created_by_details
                  ? `${req.created_by_details.first_name || ""} ${req.created_by_details.last_name || ""}`.trim() || req.created_by_details.username
                  : req.created_by_name || req.project_details?.name || "Pending Request";

                return (
                  <Link
                    key={req.id || idx}
                    href={`/project-request/approve/${req.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 hover:bg-amber-100/60 transition-colors"
                  >
                    <div className="truncate mr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {refId}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                          {displayType}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {requester}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">
                      {amt > 0
                        ? `₦${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "₦0.00"}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#F8F9FA] rounded-xl py-8 px-4 flex items-center justify-center border border-gray-100/80 text-center">
              <span className="text-xs sm:text-sm text-gray-400 font-normal">
                No pending requests
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ROW 3: BUDGET VS SPENT & SPEND BY CATEGORY */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Budget vs Spent by Projects */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              Budget vs Spent by Projects
            </h2>
            <div className="flex items-center gap-4 text-xs font-normal text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span>Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span>Spent</span>
              </div>
            </div>
          </div>

          <div className="h-[270px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="project"
                    tick={{ fill: "#6B7280", fontSize: 11 }}
                    axisLine={{ stroke: "#9CA3AF" }}
                    tickLine={false}
                  />
                  <YAxis
                    width={75}
                    tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    ticks={chartScale.ticks}
                    domain={[0, chartScale.max]}
                    tickFormatter={formatAxisNaira}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#F3F4F6", opacity: 0.6 }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const budgetVal = Number(data.budget || 0);
                        const spentVal = Number(data.spent || 0);
                        const pct = budgetVal > 0 ? ((spentVal / budgetVal) * 100).toFixed(1) : "0.0";
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[210px]">
                            <p className="font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                              {data.fullName || data.project}
                            </p>
                            <div className="flex items-center justify-between text-[#2563EB] font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                                Budget:
                              </span>
                              <span>₦{budgetVal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#16A34A] font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                                Spent:
                              </span>
                              <span>
                                ₦{spentVal.toLocaleString()}
                                <span className="text-[10px] text-gray-400 font-normal ml-1">({pct}%)</span>
                              </span>
                            </div>
                            {spentVal === 0 && (
                              <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
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
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    minPointSize={6}
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    minPointSize={6}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Spend by category */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Spend by category
            </h2>

            <div className="relative h-[200px] w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <p className="text-xs text-gray-400">No category spend data available</p>
              ) : isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name?: any) => [`${value}%`, String(name || "")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {categoryData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                    SPENT
                  </span>
                  <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                    {actualSpentDisplay}
                  </span>
                </div>
              )}
            </div>
          </div>

          {categoryData.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 text-xs text-gray-600 font-normal">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name} ({cat.value}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ROW 4: REQUEST TRANSACTIONS & APPROVED TRANSACTIONS */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Request Transactions */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Request Transactions
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">
                Most recent request transactions
              </p>
            </div>
            <Link
              href="/project-request"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              See more
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">REQUEST ID</th>
                  <th className="pb-3 font-semibold">REQUEST TYPE</th>
                  <th className="pb-3 font-semibold">REQUESTER</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 font-semibold text-right">VALUE OF REQUEST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requestTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                      No request transactions found
                    </td>
                  </tr>
                ) : (
                  requestTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 text-gray-700 whitespace-nowrap">{tx.id}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal ${tx.typeBadgeStyle}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-700 whitespace-nowrap">{tx.person}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal ${tx.statusBadgeStyle}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900 font-bold text-right whitespace-nowrap">
                        {tx.value}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Approved Transactions */}
        <div className="bg-white rounded-xl border border-gray-200/90 p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Approved Transactions
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-normal">
                Most recent approved transactions
              </p>
            </div>
            <Link
              href="/project-request"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              See more
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">REQUEST ID</th>
                  <th className="pb-3 font-semibold">REQUEST TYPE</th>
                  <th className="pb-3 font-semibold">APPROVER</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 font-semibold text-right">VALUE OF REQUEST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                      No approved transactions found
                    </td>
                  </tr>
                ) : (
                  approvedTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 text-gray-700 whitespace-nowrap">{tx.id}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal ${tx.typeBadgeStyle}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-700 whitespace-nowrap">{tx.person}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal ${tx.statusBadgeStyle}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900 font-bold text-right whitespace-nowrap">
                        {tx.value}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
