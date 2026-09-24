"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBudgetAdjustmentModal } from "@/components/project-costing/modals/AddBudgetAdjustmentModal";
import { AddDocumentModal } from "@/components/project-costing/modals/AddDocumentModal";
import { ProjectCostingExportTemplate } from "@/components/project-costing/export/ProjectCostingExportTemplate";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageGuard } from "@/components/auth/PageGuard";
import { ModuleWizard, WizardGuideButton } from "@/components/shared/wizard/ModuleWizard";
import { TransactionDetailsModal } from "@/components/project-costing/modals/TransactionDetailsModal";
import { extractAmount, formatCategory } from "@/components/project-costing/TransactionHistoryTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Plus, ChevronDown, CheckCircle2, FileText, Image as ImageIcon, Download, Loader2, FileSpreadsheet, Edit, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { 
  useGetProjectCostingProjectQuery,
  useApproveProjectMutation,
  useRejectProjectMutation,
  useSubmitProjectMutation,
  useGetBudgetAdjustmentsQuery,
  useApproveBudgetAdjustmentMutation,
  useGetProjectTransactionsQuery,
  useAddProjectDocumentMutation,
  useGetProjectSettingsQuery,
  useUpdateProjectSettingsMutation
} from "@/api/projectCostingApi";
import { Switch } from "@/components/ui/switch";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const getStatusVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
    case "APPROVED":
      return "validated";
    case "AWAITING APPROVAL":
    case "PENDING":
      return "pending";
    case "REJECTED":
      return "rejected";
    default:
      return "draft";
  }
};

const parseNumber = (val: any): number => {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function ProjectDashboardPage() {
  const params = useParams();
  const id = params?.id;
  const [showActual, setShowActual] = useState(true);
  const [showCommitted, setShowCommitted] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [isBudgetAdjustmentModalOpen, setIsBudgetAdjustmentModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("phases");
  const [isAdjExpanded, setIsAdjExpanded] = useState(true);

  // Sync tab with wizard when a guided step requires a specific tab
  React.useEffect(() => {
    const handleWizardTab = (e: any) => {
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener("wizard:tab-change", handleWizardTab);
    return () => window.removeEventListener("wizard:tab-change", handleWizardTab);
  }, []);

  // Filter States
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [costCategoryFilter, setCostCategoryFilter] = useState("all");

  const { isProjectAccessible, planName } = useSubscriptionLimits();
  const isAccessible = !id || isProjectAccessible(Number(id));

  const { data: project, isLoading, error, refetch } = useGetProjectCostingProjectQuery(
    Number(id),
    { skip: !id || !isAccessible }
  );

  if (!isAccessible) {
    return (
      <PageGuard module="project_costing" entitlement="view_project">
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-200 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Access Restricted</h2>
          <p className="text-sm text-gray-600 max-w-md mb-6">
            This project was created under a higher subscription plan and is currently locked because your account exceeds the project quota for your current <strong>{planName}</strong> plan.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="text-xs font-semibold"
            >
              Go Back
            </Button>
            <Link href="/settings/billing">
              <Button className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs font-semibold shadow-2xs">
                Upgrade Plan to Unlock
              </Button>
            </Link>
          </div>
        </div>
      </PageGuard>
    );
  }

  const { data: budgetAdjustments, isLoading: isLoadingAdjustments } = useGetBudgetAdjustmentsQuery(
    Number(id),
    { skip: !id }
  );

  const { data: rawTransactions, isLoading: isLoadingTransactions } = useGetProjectTransactionsQuery(
    Number(id),
    { skip: !id }
  );

  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : Array.isArray((rawTransactions as any)?.results)
    ? (rawTransactions as any).results
    : Array.isArray((rawTransactions as any)?.data)
    ? (rawTransactions as any).data
    : [];

  const { data: projectSettings, isLoading: isLoadingSettings, refetch: refetchSettings } = useGetProjectSettingsQuery(
    Number(id),
    { skip: !id }
  );
  const [updateProjectSettings, { isLoading: isUpdatingSettings }] = useUpdateProjectSettingsMutation();

  const statusModal = useStatusModal();

  const [approveProject, { isLoading: isApproving }] = useApproveProjectMutation();
  const [rejectProject, { isLoading: isRejecting }] = useRejectProjectMutation();
  const [submitProject, { isLoading: isSubmitting }] = useSubmitProjectMutation();
  const [approveBudgetAdjustment, { isLoading: isApprovingBudget }] = useApproveBudgetAdjustmentMutation();

  const exportRef = React.useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportPdf = async () => {
    if (!exportRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = exportRef.current;
      const canvasWidth = element.clientWidth;
      const canvasHeight = element.clientHeight;
      
      const imgData = await toJpeg(element, {
        cacheBust: true,
        pixelRatio: 1.5,
        quality: 0.8,
        backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF("l", "mm", "a4");
      const margin = 10; // 10mm margin
      const imgWidth = 297 - (margin * 2); // A4 width in mm (landscape)
      const pageHeight = 210; // A4 height in mm (landscape)
      const usableHeight = pageHeight - (margin * 2);
      
      const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // This shifts the image up relative to the page
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position + margin, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= usableHeight;
      }

      pdf.save(`${project?.name || "Project"}_Costing_Details.pdf`);
      statusModal.showSuccess("Export Successful", "PDF document has been generated.");
    } catch (err: any) {
      console.error("PDF export error", err);
      statusModal.showError("Export Failed", `Failed to generate PDF document: ${err.message || String(err)}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setIsExportingImage(true);
    try {
      const element = exportRef.current;
      const image = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement("a");
      link.href = image;
      link.download = `${project?.name || "Project"}_Costing_Details.png`;
      link.click();
      statusModal.showSuccess("Export Successful", "Full detail image has been downloaded.");
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportWbsCsv = () => {
    try {
      let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility
      csvContent += `Project Costing - Work Breakdown Structure (WBS)\n`;
      csvContent += `Project Name: "${(project?.name || "Project").replace(/"/g, '""')}"\n`;
      csvContent += `Project Code: "${(project?.project_code || "N/A").replace(/"/g, '""')}"\n`;
      csvContent += `Export Date: "${new Date().toLocaleDateString("en-US")}"\n\n`;

      const headers = ["S/N", "Phase / Activity Name", "Type", "Quantity", "Unit Rate (NGN)", "Total Budget (NGN)"];
      if (customColumns && customColumns.length > 0) {
        customColumns.forEach(col => headers.push(`"${col.replace(/"/g, '""')}"`));
      }
      csvContent += headers.join(",") + "\n";

      if (parsedPhases && Array.isArray(parsedPhases)) {
        parsedPhases.forEach((phase: any, pIndex: number) => {
          const phaseSn = `${pIndex + 1}`;
          const phaseName = `"${(phase.name || `Phase ${pIndex + 1}`).replace(/"/g, '""')}"`;
          const phaseTotal = phase.activities?.reduce((sum: number, act: any) => sum + Number(act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0), 0) || 0;
          
          const phaseRow = [phaseSn, phaseName, "PHASE", "", "", phaseTotal];
          if (customColumns && customColumns.length > 0) {
            customColumns.forEach(() => phaseRow.push(""));
          }
          csvContent += phaseRow.join(",") + "\n";

          if (phase.activities && Array.isArray(phase.activities)) {
            phase.activities.forEach((act: any, aIndex: number) => {
              const actSn = `${pIndex + 1}.${aIndex + 1}`;
              const actName = `"${(act.name || "").replace(/"/g, '""')}"`;
              const qty = act.quantity || 1;
              const rate = act.rate || (Number(act.amount || 0) / Number(qty));
              const amount = act.amount || (Number(qty) * Number(rate)) || 0;

              const actRow = [actSn, actName, "ACTIVITY", qty, rate, amount];
              if (customColumns && customColumns.length > 0) {
                customColumns.forEach(col => {
                  const val = act[col] || act.custom_values?.[col] || "";
                  actRow.push(`"${String(val).replace(/"/g, '""')}"`);
                });
              }
              csvContent += actRow.join(",") + "\n";
            });
          }
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${(project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_WBS.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      statusModal.showSuccess("Export Successful", "WBS CSV file has been downloaded.");
    } catch (err: any) {
      console.error("WBS CSV export error", err);
      statusModal.showError("Export Failed", `Failed to generate WBS CSV file: ${err.message || String(err)}`);
    }
  };

  const handleAction = async (actionFn: any, actionName: string) => {
    try {
      await actionFn({ id: Number(id), body: { project_code: project?.project_code } }).unwrap();
      statusModal.showSuccess(
        "Action Successful",
        `Project ${actionName} successfully.`
      );
      refetch();
    } catch (err) {
      console.error(`Failed to ${actionName} project`, err);
      statusModal.showError(
        "Action Failed",
        `Failed to ${actionName} project.`
      );
    }
  };

  const handleApproveAdjustment = async (adj: any) => {
    try {
      await approveBudgetAdjustment({ 
        id: Number(id), 
        adjustment_id: adj.uuid,
        body: { 
          id: adj.id || adj.uuid,
          uuid: adj.uuid,
          adjustment_id: adj.id || adj.uuid,
          budget_adjustment_id: adj.id || adj.uuid,
          budget_adjustment: adj.id || adj.uuid,
          reference_no: adj.reference_no 
        } 
      }).unwrap();
      statusModal.showSuccess(
        "Action Successful",
        `Budget adjustment ${adj.reference_no || ''} approved successfully.`
      );
      refetch();
    } catch (err) {
      console.error("Failed to approve budget adjustment", err);
      statusModal.showError(
        "Action Failed",
        "Failed to approve budget adjustment."
      );
    }
  };

  const parsedBudgetAdjustments = (budgetAdjustments && ((budgetAdjustments as any).data || (budgetAdjustments as any).results)) || budgetAdjustments || [];
  const pendingAdjsList = Array.isArray(parsedBudgetAdjustments) ? parsedBudgetAdjustments.filter((a: any) => ["PENDING", "PENDING_APPROVAL", "DRAFT"].includes(a.status?.toUpperCase())) : [];
  let pendingAdjsTotal = pendingAdjsList.reduce((acc: number, a: any) => acc + Number(a.total_adjustment || a.amount || 0), 0);

  const approvedAdjustments = Array.isArray(parsedBudgetAdjustments)
    ? parsedBudgetAdjustments.filter((a: any) => ["APPROVED", "COMPLETED"].includes(a.status?.toUpperCase()))
    : [];
  const totalApprovedRevision = approvedAdjustments.reduce((acc: number, a: any) => acc + Number(a.total_adjustment || a.amount || 0), 0);
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 pb-20">
        {/* Top Navigation Row */}
        <div className="flex items-center px-6 py-4 bg-white border-b border-gray-100">
          <Skeleton className="h-4 w-36 bg-gray-200" />
        </div>

        <div className="px-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 mt-6">
          {/* Project Header Info Skeleton */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-64 bg-gray-200" />
                <Skeleton className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 bg-gray-200 mt-1" />
              <Skeleton className="h-4 w-96 bg-gray-200 mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-32 bg-gray-200" />
              <Skeleton className="h-9 w-32 bg-gray-200" />
            </div>
          </div>

          {/* Filters and Actions Skeleton */}
          <div className="flex items-end justify-between py-2 border-b border-gray-100 pb-6">
            <div className="flex gap-8 items-center">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20 bg-gray-200" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-36 bg-gray-200" />
                  <Skeleton className="h-9 w-36 bg-gray-200" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28 bg-gray-200" />
                <Skeleton className="h-9 w-56 bg-gray-200" />
              </div>
            </div>
            <Skeleton className="h-9 w-48 bg-gray-200" />
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 bg-white rounded shadow-sm border border-gray-100">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="p-4 border-r border-gray-100 last:border-r-0">
                    <Skeleton className="h-3 w-16 bg-gray-200 mb-2" />
                    <Skeleton className="h-6 w-24 bg-gray-200" />
                  </div>
                ))}
              </div>

              {/* Line Chart Card */}
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 min-h-[380px] flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-48 bg-gray-200" />
                  <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
                <Skeleton className="flex-1 w-full bg-gray-100 rounded" />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-1 flex flex-col gap-6">
              {/* Budget Utilization */}
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex flex-col gap-4">
                <Skeleton className="h-5 w-36 bg-gray-200" />
                <Skeleton className="h-4 w-28 bg-gray-200" />
                <Skeleton className="h-8 w-full bg-gray-100 rounded mt-2" />
                <Skeleton className="h-4 w-3/4 bg-gray-200" />
              </div>

              {/* Pending Requests */}
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex flex-col gap-3">
                <Skeleton className="h-5 w-40 bg-gray-200" />
                <Skeleton className="h-8 w-16 bg-gray-200 mt-2" />
                <Skeleton className="h-8 w-32 bg-gray-200" />
              </div>

              {/* Spend by Category */}
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex flex-col gap-4">
                <Skeleton className="h-5 w-36 bg-gray-200" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-36 w-36 bg-gray-200 rounded-full" />
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-full bg-gray-200" />
                    <Skeleton className="h-4 w-5/6 bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
        <p className="text-red-500 text-sm mb-4">Failed to load project costing dashboard.</p>
        <Link href="/project-costing">
          <Button className="bg-[#3B7CED] text-white">Back to Project Costing</Button>
        </Link>
      </div>
    );
  }

  let actualSpend = 0;
  let committed = 0;
  let remaining = 0;
  let variance = "0%";
  let fin: any = null;
  let budgetNum = 0;
  let originalBudgetNum = 0;
  let parsedPhases: any[] = [];

  if (project?.phases) {
    try {
      parsedPhases = typeof project.phases === "string" ? JSON.parse(project.phases) : project.phases;
    } catch (e) {
      console.error("Failed to parse phases", e);
    }
  }

  let customColumns: string[] = [];
  if (parsedPhases && parsedPhases.length > 0) {
    const colSet = new Set<string>();
    const standardKeys = new Set([
      "id",
      "name",
      "quantity",
      "qty",
      "rate",
      "amount",
      "budget",
      "total_budget",
      "total_amount",
      "start_date",
      "end_date",
      "status",
      "cost_category",
      "sn",
      "s/n",
      "s_n",
      "serial",
      "serial_number",
      "serial number",
      "serial_no",
      "serial no",
      "phase",
      "phase_name",
      "phase_id",
      "subphase",
      "sub_phase",
      "activity",
      "activity_name",
      "displayname",
      "custom_values",
      "approved_revision",
      "approve_revision",
      "approved revision",
      "approved_revisions",
      "approved_adjustment",
      "approved_adjustments",
      "revision",
      "revisions",
      "revised_budget",
      "revised budget",
      "original_budget",
      "original budget",
      "current_budget",
      "current budget",
      "approved_budget",
      "approved budget",
      "wbs_code",
      "wbs code",
      "code",
      "created_at",
      "updated_at",
      "project",
      "project_id",
      "uuid",
      "pk",
      "order",
      "sequence",
      "sort_order",
    ]);
    parsedPhases.forEach((phase: any) => {
      if (phase.activities && Array.isArray(phase.activities)) {
        phase.activities.forEach((act: any) => {
          Object.keys(act).forEach((key) => {
            const lower = key.toLowerCase().trim();
            if (
              !standardKeys.has(lower) &&
              !lower.includes("revision") &&
              !lower.includes("budget") &&
              !lower.includes("adjust")
            ) {
              colSet.add(key);
            }
          });
          if (act.custom_values && typeof act.custom_values === "object") {
            Object.keys(act.custom_values).forEach((key) => {
              const lower = key.toLowerCase().trim();
              if (
                !standardKeys.has(lower) &&
                !lower.includes("revision") &&
                !lower.includes("budget") &&
                !lower.includes("adjust")
              ) {
                colSet.add(key);
              }
            });
          }
        });
      }
    });
    customColumns = Array.from(colSet);
  }

  if (project?.financials) {
    try {
      fin = typeof project.financials === "string" ? JSON.parse(project.financials) : project.financials;
      
      if (costCategoryFilter !== "all") {
         // Filter Actual Spend by Category
         if (fin?.category_breakdown) {
            const cat = fin.category_breakdown.find((c: any) => 
               c.request_type.toLowerCase() === costCategoryFilter.toLowerCase() || 
               c.request_type.toLowerCase().replace("_", "") === costCategoryFilter.toLowerCase().replace("_", "")
            );
            actualSpend = cat ? Number(cat.amount) : 0;
            committed = 0; // Committed is generally an aggregate right now
         }

         // Filter Budget by Category (traverse phases)
         let filteredBudget = 0;
         const sumCategoryBudget = (phases: any[]) => {
           for (const phase of phases) {
              if (phase.activities) {
                 for (const act of phase.activities) {
                    if (act.cost_category && act.cost_category.toLowerCase() === costCategoryFilter.toLowerCase()) {
                       filteredBudget += Number(act.amount || 0);
                    }
                 }
              }
           }
         };
         sumCategoryBudget(parsedPhases);
         budgetNum = filteredBudget;
      } else {
        // All Categories
        actualSpend = parseNumber(fin.actual ?? fin.spent ?? fin.actual_spend ?? fin.total_actual_spend ?? fin.total_actual_cost ?? 0);
        committed = parseNumber(fin.committed ?? fin.committed_spend ?? fin.total_committed ?? fin.total_commitment ?? 0);
        budgetNum = parseNumber(fin.budget ?? fin.total_budget ?? fin.total_amount ?? 0);
      }
      
      // Fallback for pending adjustments if empty
      if (pendingAdjsList.length === 0) {
        if (fin.pending_requests_count !== undefined || fin.pending_count !== undefined || fin.pending_approval_count !== undefined) {
           const count = Number(fin.pending_requests_count || fin.pending_count || fin.pending_approval_count || 0);
           if (count > 0) {
             pendingAdjsList.length = count;
             pendingAdjsTotal = Number(fin.pending_requests_value || fin.pending_value || fin.pending_approval_value || 0);
           }
        }
      }
    } catch (e) {
      console.error("Failed to parse financials", e);
    }
  }

  if (budgetNum === 0) {
    budgetNum = parseNumber(
      project?.budget ??
      project?.total_budget ??
      project?.contract_amount ??
      project?.total_amount ??
      project?.approved_budget ??
      0
    );
  }

  if (budgetNum === 0 && parsedPhases.length > 0) {
    budgetNum = parsedPhases.reduce((acc, phase) => {
      return acc + (phase.activities || []).reduce((sum: number, act: any) => sum + parseNumber(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || act.budget || 0), 0);
    }, 0);
  }

  if (actualSpend === 0) {
    actualSpend = parseNumber(
      project?.actual_spend ??
      project?.spent ??
      project?.actual ??
      project?.total_actual_spend ??
      project?.actual_cost ??
      project?.total_actual_cost ??
      0
    );
  }

  if (committed === 0) {
    committed = parseNumber(
      project?.committed_spend ??
      project?.committed ??
      project?.total_committed ??
      project?.commitment ??
      project?.total_commitment ??
      0
    );
  }

  // Check transactions list to calculate or augment actualSpend and committed if needed
  const txList = Array.isArray(transactions)
    ? transactions
    : Array.isArray((transactions as any)?.results)
    ? (transactions as any).results
    : Array.isArray((transactions as any)?.data)
    ? (transactions as any).data
    : [];

  let txActualSum = 0;
  let txCommittedSum = 0;
  txList.forEach((tx: any) => {
    const amt = extractAmount(tx);
    const status = String(tx.status || "").toLowerCase();
    if (status.includes("approv") || status === "done" || status === "success" || status === "released" || status === "paid" || status === "invoice") {
      txActualSum += amt;
    } else {
      txCommittedSum += amt;
    }
  });

  if (actualSpend === 0 && txActualSum > 0) {
    actualSpend = txActualSum;
  }
  if (committed === 0 && txCommittedSum > 0) {
    committed = txCommittedSum;
  }

  if (costCategoryFilter === "all" && fin?.remaining_budget !== undefined && fin?.remaining_budget !== null) {
    remaining = parseNumber(fin.remaining_budget);
  } else {
    remaining = budgetNum - actualSpend - committed;
  }

  originalBudgetNum = parseNumber(fin?.original_budget || budgetNum);
  if (originalBudgetNum === 0) originalBudgetNum = budgetNum;

  const isProjectApproved = ["ACTIVE", "APPROVED", "COMPLETED", "CLOSED"].includes(
    (project?.status || "").toUpperCase()
  );

  const hasAdjustments =
    isProjectApproved &&
    (approvedAdjustments.length > 0 ||
      (parsedPhases &&
        Array.isArray(parsedPhases) &&
        parsedPhases.some((p: any) =>
          p.activities?.some((a: any) => Math.abs(Number(a.approved_revision || a.revision || 0)) > 0)
        )));

  const pendingBudgetsCount = pendingAdjsList.length > 0
    ? pendingAdjsList.length
    : Number(fin?.pending_requests_count || fin?.pending_count || fin?.pending_approval_count || 0);

  const getActivityApprovedRevision = (act: any): number => {
    if (act.approved_revision !== undefined && act.approved_revision !== null) {
      return Number(act.approved_revision);
    }
    if (act.revision !== undefined && act.revision !== null) {
      return Number(act.revision);
    }
    if (act.approved_adjustment !== undefined && act.approved_adjustment !== null) {
      return Number(act.approved_adjustment);
    }

    if (approvedAdjustments.length > 0) {
      let revSum = 0;
      let matched = false;
      approvedAdjustments.forEach((adj: any) => {
        if (adj.lines && Array.isArray(adj.lines)) {
          adj.lines.forEach((line: any) => {
            const matches =
              (line.activity && String(line.activity) === String(act.id)) ||
              (line.activity_id && String(line.activity_id) === String(act.id)) ||
              (line.activity_name && act.name && line.activity_name.trim().toLowerCase() === act.name.trim().toLowerCase());
            if (matches) {
              matched = true;
              const isDecrease = line.direction?.toUpperCase() === "DECREASE" || Number(line.adjustment_amount || line.amount || 0) < 0;
              const lineAmt = Math.abs(Number(
                line.rate ? (Number(line.quantity || 1) * Number(line.rate)) :
                (line.adjustment_amount !== undefined ? line.adjustment_amount : (line.amount || 0))
              ));
              revSum += isDecrease ? -lineAmt : lineAmt;
            }
          });
        }
      });
      if (matched) return revSum;
    }

    if (act.current_budget !== undefined && act.current_budget !== null) {
      const orig = Number(act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0);
      const curr = Number(act.current_budget);
      if (curr !== orig && orig > 0) {
        return curr - orig;
      }
    }

    return 0;
  };

  variance = fin?.consumed_percent !== undefined
    ? `${Number(fin.consumed_percent).toFixed(1)}%`
    : (budgetNum > 0 ? `${((actualSpend / budgetNum) * 100).toFixed(1)}%` : "0%");

  const finPercent = budgetNum > 0 ? actualSpend / budgetNum : 0;
  const actualPercent = budgetNum > 0 ? actualSpend / budgetNum : 0;
  const committedPercent = budgetNum > 0 ? committed / budgetNum : 0;
  const availablePercent = budgetNum > 0 ? remaining / budgetNum : 1;

  let dynamicLineChartData: any[] = [];
  const chartBudget = budgetNum > 0 ? budgetNum : (actualSpend + committed > 0 ? (actualSpend + committed) : 0);

  if (chartBudget > 0 || actualSpend > 0 || committed > 0) {
    // 1. Check if backend provided a real time-series array in financials or project
    const backendTimeline = fin?.spend_over_time || fin?.monthly_spend || fin?.spend_history || project?.spend_over_time;

    if (Array.isArray(backendTimeline) && backendTimeline.length > 0) {
      dynamicLineChartData = backendTimeline.map((item: any) => ({
        name: item.period || item.month || item.date || item.name,
        fullName: item.full_name || item.period || item.name,
        planned: parseNumber(item.planned ?? item.planned_budget ?? item.budget ?? 0),
        actual: parseNumber(item.actual ?? item.spent ?? item.actual_spend ?? 0),
        committed: parseNumber(item.committed ?? item.committed_spend ?? 0),
      }));
    } else {
      // 2. Real Project Date Timeline from start_date to expected_end_date
      const start = project?.start_date ? new Date(project.start_date) : null;
      const end = project?.expected_end_date ? new Date(project.expected_end_date) : null;
      const hasValidStart = start && !isNaN(start.getTime());
      const hasValidEnd = end && !isNaN(end.getTime());
      const hasValidDates = hasValidStart && hasValidEnd && start < end;
      
      const monthDiff = hasValidDates
        ? (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1
        : 1;

      if (monthDiff > 1 && hasValidDates && start && end) {
        dynamicLineChartData.push({
          name: "Start",
          fullName: "Project Start",
          planned: 0,
          actual: 0,
          committed: 0,
        });

        for (let i = 0; i < monthDiff; i++) {
          const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
          const plannedValue = Math.round((budgetNum / monthDiff) * (i + 1));

          dynamicLineChartData.push({
            name: d.toLocaleString('default', { month: 'short' }),
            fullName: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
            planned: plannedValue,
            actual: actualSpend,
            committed: committed,
          });
        }
      } else {
        dynamicLineChartData = [
          { name: "Start", fullName: "Project Start", planned: 0, actual: 0, committed: 0 },
          { name: "Target", fullName: "Project Completion", planned: chartBudget, actual: actualSpend, committed: committed },
        ];
      }
    }
  }

  const renderPhaseRows = (phases: any[]): React.ReactNode => {
    if (!phases || !Array.isArray(phases)) return null;
    let serialCounter = 1;

    return phases.flatMap((phase, pIndex) => {
      const phaseName = phase.name || `Phase ${pIndex + 1}`;
      let phaseOrig = 0;
      let phaseRevision = 0;
      let phaseBudget = 0;
      
      if (phase.activities && Array.isArray(phase.activities)) {
        phase.activities.forEach((act: any) => {
          const q = Number(act.quantity || 1);
          const r = Number(act.rate || 0);
          const orig = Number(act.original_budget || act.amount || (q * r) || 0);
          const rev = getActivityApprovedRevision(act);
          const curr = act.current_budget !== undefined && act.current_budget !== null 
            ? Number(act.current_budget) 
            : (orig + rev);
          phaseOrig += orig;
          phaseRevision += rev;
          phaseBudget += curr;
        });
      }

      const rows = [
        <TableRow key={`phase-${phase.id || pIndex}`} className="bg-[#EEF2FB] hover:bg-[#EEF2FB] border-b border-white">
          <TableCell colSpan={4} className="py-3 px-4 bg-[#EEF2FB]">
            <div className="flex items-center gap-2">
              <span className="text-[#3B7CED] text-sm font-bold uppercase tracking-wide">Phase:</span>
              <span className="font-bold text-base text-gray-900">{phaseName}</span>
            </div>
          </TableCell>
          <TableCell className="py-3 font-bold text-base bg-[#EEF2FB] text-gray-900">
            {phaseOrig > 0 ? `₦${phaseOrig.toLocaleString()}` : "₦0"}
          </TableCell>
          {hasAdjustments && (
            <>
              <TableCell className="py-3 font-bold text-base bg-[#EEF2FB] text-gray-900">
                {phaseRevision !== 0 
                  ? `${phaseRevision > 0 ? "+" : ""}₦${phaseRevision.toLocaleString()}` 
                  : "₦0.00"}
              </TableCell>
              <TableCell className="py-3 font-bold text-base bg-[#EEF2FB] text-gray-900">
                {phaseBudget > 0 ? `₦${phaseBudget.toLocaleString()}` : "₦0"}
              </TableCell>
            </>
          )}
          {customColumns.map(col => <TableCell key={col} className="bg-[#EEF2FB]" />)}
        </TableRow>
      ];

      if (phase.activities && Array.isArray(phase.activities)) {
        phase.activities.forEach((act: any, aIndex: number) => {
          const actName = act.name || `Activity ${aIndex + 1}`;
          const quantity = Number(act.quantity || 1);
          const rate = Number(act.rate || 0);
          const origAmt = Number(act.original_budget || act.amount || (quantity * rate) || 0);
          const actRevision = getActivityApprovedRevision(act);
          const actBudget = act.current_budget !== undefined && act.current_budget !== null
            ? Number(act.current_budget)
            : (origAmt + actRevision);
          const currentSn = serialCounter++;

          rows.push(
            <TableRow key={`act-${phase.id || pIndex}-${act.id || aIndex}`} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
              <TableCell className="py-3 text-sm font-medium text-gray-500 text-center pl-4">
                {currentSn}
              </TableCell>
              <TableCell className="py-3 text-sm font-medium text-gray-800">
                {actName}
              </TableCell>
              <TableCell className="py-3 text-sm text-gray-600">
                {quantity}
              </TableCell>
              <TableCell className="py-3 text-sm text-gray-600">
                ₦{rate.toLocaleString()}
              </TableCell>
              <TableCell className="py-3 font-medium text-sm text-gray-800">
                ₦{origAmt.toLocaleString()}
              </TableCell>
              {hasAdjustments && (
                <>
                  <TableCell className={`py-3 font-medium text-sm ${actRevision > 0 ? "text-green-600" : actRevision < 0 ? "text-red-500" : "text-gray-600"}`}>
                    {actRevision !== 0 ? `${actRevision > 0 ? "+" : ""}₦${actRevision.toLocaleString()}` : "₦0.00"}
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-sm text-gray-900">
                    ₦{actBudget.toLocaleString()}
                  </TableCell>
                </>
              )}
              {customColumns.map(col => (
                <TableCell key={col} className="py-3 text-sm text-gray-600">
                  {act[col] || act.custom_values?.[col] || ""}
                </TableCell>
              ))}
            </TableRow>
          );
        });
      }

      return rows;
    });
  };

  // Set up PieChart data from backend category_breakdown
  let pieChartData: any[] = [];
  const CATEGORY_COLORS = ["#3B7CED", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#64748B"];

  const rawCatBreakdown =
    fin?.category_breakdown ||
    project?.category_breakdown ||
    (typeof project?.financials === "object" ? project?.financials?.category_breakdown : null);

  let rawCatList: any[] = [];
  if (Array.isArray(rawCatBreakdown)) {
    rawCatList = rawCatBreakdown;
  } else if (rawCatBreakdown && typeof rawCatBreakdown === "object") {
    rawCatList = Object.entries(rawCatBreakdown).map(([k, v]: [string, any]) =>
      typeof v === "object" && v !== null ? { request_type: k, ...v } : { request_type: k, amount: v }
    );
  }

  const formatCostCategory = (cat: string): string => {
    if (!cat) return "General";
    const lower = cat.toLowerCase().trim();
    if (lower === "plant_equipment" || lower === "plant equipment" || lower === "plant & equipment") return "Plant & Equipment";
    if (lower === "material_consumption" || lower === "material consumption") return "Material Consumption";
    if (lower === "petty_cash" || lower === "petty cash") return "Petty Cash";
    return formatCategory(cat);
  };

  if (rawCatList.length > 0) {
    const totalCatAmount = rawCatList.reduce(
      (sum: number, cat: any) => sum + parseNumber(cat.amount || cat.value || cat.spent || 0),
      0
    );

    const items = rawCatList
      .map((cat: any) => {
        const amt = parseNumber(cat.amount || cat.value || cat.spent || 0);
        let pct =
          cat.percentage !== undefined && cat.percentage !== null && !isNaN(Number(cat.percentage))
            ? Number(cat.percentage)
            : 0;

        // If backend percentage is not supplied or 0, accurately calculate from total category amounts
        if (pct <= 0 && totalCatAmount > 0 && amt > 0) {
          pct = (amt / totalCatAmount) * 100;
        }

        const nameKey = cat.request_type || cat.name || cat.category || cat.type || "General";
        return {
          name: formatCostCategory(nameKey),
          amount: amt,
          percentage: pct,
          value: Number(pct.toFixed(2)),
        };
      })
      .filter((item: any) => item.percentage > 0 || item.amount > 0)
      .sort((a: any, b: any) => b.percentage - a.percentage);

    pieChartData = items.map((item: any, index: number) => ({
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }

  // Fallback to categorizing from transactions if category_breakdown is missing
  if (pieChartData.length === 0 && txList.length > 0) {
    const catMap = new Map<string, number>();
    let txSum = 0;
    txList.forEach((tx: any) => {
      const cat = formatCostCategory(tx.category || tx.request_type || tx.type || "General");
      const amt = extractAmount(tx);
      if (amt > 0) {
        catMap.set(cat, (catMap.get(cat) || 0) + amt);
        txSum += amt;
      }
    });

    const fallbackItems: any[] = [];
    catMap.forEach((amt, name) => {
      const pct = txSum > 0 ? (amt / txSum) * 100 : 0;
      fallbackItems.push({
        name,
        amount: amt,
        percentage: pct,
        value: Number(pct.toFixed(2)),
      });
    });

    fallbackItems.sort((a, b) => b.percentage - a.percentage);
    pieChartData = fallbackItems.map((item, index) => ({
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }

  const categoryTotal = pieChartData.reduce((s: number, e: any) => s + e.value, 0);

  return (
    <PageGuard module="project_costing" entitlement="view_project">
    <div className="flex flex-col h-full bg-gray-50 relative pb-20">
      {/* Top Navigation Row */}
      <div className="flex items-center px-6 py-4">
        <Link href="/project-costing" className="flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {project.name}
        </Link>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 overflow-y-auto">
        
        {/* Project Header Info */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
              {project.status === "ACTIVE" ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-0.5 border-0 font-medium text-xs">Active</Badge>
              ) : (
                <Badge variant={getStatusVariant(project.status) as any} className="px-3 py-0.5 font-medium border-0 text-xs">{project.status || "DRAFT"}</Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-2">{project.project_code || "N/A"}</div>
            <div className="text-sm text-gray-800 mt-1">
              <span className="font-semibold text-gray-600">Project Manager:</span>{" "}
              {project.project_manager_details?.first_name || project.project_manager_details?.last_name
                ? `${project.project_manager_details.first_name || ""} ${project.project_manager_details.last_name || ""}`.trim()
                : project.project_manager_details?.email || "N/A"}{" "}
              <span className="mx-2"> </span>{" "}
              <span className="font-semibold text-gray-600">Date:</span> {project.start_date || "N/A"} - {project.expected_end_date || "N/A"}
            </div>
          </div>
          
          <div data-wizard="pc-header-actions" className="flex items-center gap-3">
            <PermissionGuard module="project_costing" entitlement="export_reports">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 h-9 font-medium flex items-center gap-2 px-4 shadow-sm">
                    <Download className="w-4 h-4" />
                    {isExportingPdf || isExportingImage ? "Exporting..." : "Export Report"}
                    <ChevronDown className="w-4 h-4 opacity-70 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-gray-100 p-1">
                  <DropdownMenuItem 
                    onClick={handleExportPdf} 
                    disabled={isExportingPdf} 
                    className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-700">Download as PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportImage} 
                    disabled={isExportingImage} 
                    className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 focus:bg-gray-50 mt-1"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">Download as Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportWbsCsv} 
                    className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 focus:bg-gray-50 mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">Download WBS (CSV)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGuard>

            <WizardGuideButton moduleId="project-costing" />

            {(!project.status || project.status === "DRAFT" || project.status === "PENDING" || project.status === "PENDING_APPROVAL") && (
              <Link href={`/project-costing/${project.id}/edit`}>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 flex items-center gap-1.5 px-3.5">
                  <Edit className="w-3.5 h-3.5 text-gray-500" />
                  <span>Edit Project</span>
                </Button>
              </Link>
            )}

            {(!project.status || project.status === "DRAFT") && (
              <PermissionGuard module="project_costing" entitlement="submit_project">
                <Button 
                  onClick={() => handleAction(submitProject, "submitted")}
                  disabled={isSubmitting}
                  className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9"
                >
                  {isSubmitting ? "Submitting..." : "Submit Project"}
                </Button>
              </PermissionGuard>
            )}
            
            {(project.status === "PENDING" || project.status === "PENDING_APPROVAL") && (
              <>
                <PermissionGuard module="project_costing" entitlement="reject_project">
                  <Button 
                    onClick={() => handleAction(rejectProject, "rejected")}
                    disabled={isRejecting || isApproving}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 h-9"
                  >
                    {isRejecting ? "Rejecting..." : "Reject"}
                  </Button>
                </PermissionGuard>
                <PermissionGuard module="project_costing" entitlement="approve_project">
                  <Button 
                    onClick={() => handleAction(approveProject, "approved")}
                    disabled={isApproving || isRejecting}
                    className="bg-[#2BA24D] hover:bg-[#22853d] text-white h-9"
                  >
                    {isApproving ? "Approving..." : "Approve"}
                  </Button>
                </PermissionGuard>
              </>
            )}
          </div>
        </div>

        {/* Main Dashboard Container */}
        <div className="flex flex-col gap-6 bg-gray-50 p-2 rounded-xl">

        {/* Filters and Actions */}
        <div className="flex items-end justify-between py-2 border-b border-gray-100 pb-6">
          <div className="flex gap-8 items-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Date Range</label>
              <div className="flex gap-2">
                <Input type="date" placeholder="From" className="w-36 h-9" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <Input type="date" placeholder="To" className="w-36 h-9" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Cost Category</label>
              <Select value={costCategoryFilter} onValueChange={setCostCategoryFilter}>
                <SelectTrigger className="w-56 h-9 text-gray-600">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="labour">Labour</SelectItem>
                  <SelectItem value="material_consumption">Material Consumption</SelectItem>
                  <SelectItem value="plant_equipment">Plant Equipment</SelectItem>
                  <SelectItem value="sub_contractor">Sub Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <PermissionGuard module="project_costing" entitlement="submit_budget_adjustment">
              <Button
                data-wizard="pc-create-adjustment-btn"
                onClick={() => setIsBudgetAdjustmentModalOpen(true)}
                variant="outline"
                className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 hover:text-[#3B7CED] h-9 font-medium px-6"
              >
                Create Budget Adjustment
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Main Content Grid */}
        <div data-wizard="pc-charts-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2/3 width) */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div data-wizard="pc-kpis-chart" className="grid grid-cols-2 md:grid-cols-5 bg-white rounded shadow-sm border border-gray-100">
              <div className="p-4 border-r border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-1">Budget</div>
                <div className="text-lg font-semibold text-gray-800">₦{budgetNum.toLocaleString()}</div>
              </div>
              <div className="p-4 border-r border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-1">Actual Spent</div>
                <div className="text-lg font-semibold text-gray-800">₦{actualSpend.toLocaleString()}</div>
              </div>
              <div className="p-4 border-r border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-1">Committed Amount</div>
                <div className="text-lg font-semibold text-gray-800">₦{committed.toLocaleString()}</div>
              </div>
              <div className="p-4 border-r border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-1">Remaining</div>
                <div className="text-lg font-semibold text-gray-800">₦{remaining.toLocaleString()}</div>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Variance</div>
                <div className="text-lg font-semibold text-gray-800">{variance}</div>
              </div>
            </div>

            {/* Line / Area Chart */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#3B7CED]">Spend Over Time vs Budget Curve</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Cumulative planned budget vs committed and actual expenditure over project duration
                  </p>
                </div>
                {/* Interactive Series Toggle Pills */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    type="button"
                    onClick={() => setShowActual(!showActual)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                      showActual
                        ? "bg-[#EBF7EE] border-[#2BA24D]/40 text-[#1E8E3E] shadow-sm shadow-[#2BA24D]/10"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-60"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-transform ${showActual ? "bg-[#2BA24D] scale-110" : "bg-gray-300"}`} />
                    <span>Actual Spent</span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                      showActual ? "bg-[#2BA24D] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {showActual ? "✓" : "–"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCommitted(!showCommitted)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                      showCommitted
                        ? "bg-[#FEF7EC] border-[#F59E0B]/40 text-[#B45309] shadow-sm shadow-[#F59E0B]/10"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-60"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-transform ${showCommitted ? "bg-[#F59E0B] scale-110" : "bg-gray-300"}`} />
                    <span>Committed Spent</span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                      showCommitted ? "bg-[#F59E0B] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {showCommitted ? "✓" : "–"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPlanned(!showPlanned)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                      showPlanned
                        ? "bg-[#EFF6FF] border-[#3B7CED]/40 text-[#1D4ED8] shadow-sm shadow-[#3B7CED]/10"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-60"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-transform ${showPlanned ? "bg-[#3B7CED] scale-110" : "bg-gray-300"}`} />
                    <span>Planned Spend</span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                      showPlanned ? "bg-[#3B7CED] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {showPlanned ? "✓" : "–"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicLineChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B7CED" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#3B7CED" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2BA24D" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#2BA24D" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="committedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F3F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={{ stroke: '#E5E7EB' }} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      tickFormatter={(val) => {
                        if (val === 0) return "₦0";
                        if (val >= 1000000) return `₦${(val / 1000000).toFixed(1)}M`;
                        return `₦${Math.round(val / 1000)}k`;
                      }} 
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0]?.payload;
                          const fullName = dataPoint?.fullName || label;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
                              <p className="font-semibold text-gray-800 mb-2 border-b border-gray-100 pb-1">{fullName}</p>
                              {payload.map((entry: any, index: number) => {
                                const isPlanned = entry.dataKey === "planned";
                                const isCommitted = entry.dataKey === "committed";
                                const color = isPlanned ? "#3B7CED" : isCommitted ? "#F59E0B" : "#2BA24D";
                                const name = isPlanned ? "Planned Budget" : isCommitted ? "Committed Spent" : "Actual Spent";
                                const value = entry.value !== null && entry.value !== undefined ? `₦${Number(entry.value).toLocaleString()}` : "Not reached";
                                return (
                                  <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
                                    <span className="flex items-center gap-1.5 text-gray-600">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                      {name}:
                                    </span>
                                    <span className="font-medium text-gray-900">{value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {showPlanned && (
                      <Area 
                        type="monotone" 
                        dataKey="planned" 
                        stroke="#3B7CED" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#plannedGradient)" 
                        dot={{ r: 4, fill: '#3B7CED', strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#3B7CED' }} 
                        name="Planned Spend"
                      />
                    )}
                    {showCommitted && (
                      <Area 
                        type="monotone" 
                        dataKey="committed" 
                        stroke="#F59E0B" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#committedGradient)" 
                        dot={{ r: 4, fill: '#F59E0B', strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#F59E0B' }} 
                        name="Committed Spent"
                      />
                    )}
                    {showActual && (
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#2BA24D" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#actualGradient)" 
                        dot={{ r: 4, fill: '#2BA24D', strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#2BA24D' }} 
                        name="Actual Spent"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                {/* Fallback for empty data */}
                {dynamicLineChartData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-400 text-sm">No spend data available</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (1/3 width) */}
          <div className="col-span-1 flex flex-col gap-6">
            
            {/* Budget Utilization */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#3B7CED]">Budget Utilization</h3>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-500">Budget Health:</span>
                {fin?.budget_health === "ON_TRACK" ? (
                  <Badge className="bg-green-100 text-green-600 border-transparent hover:bg-green-100 text-xs py-0.5">On Track</Badge>
                ) : (fin?.budget_health === "AT_RISK" || fin?.budget_health === "OVER_BUDGET" || finPercent > 0.8) ? (
                  <Badge className="bg-orange-100 text-orange-600 border-transparent hover:bg-orange-100 text-xs py-0.5">At Risk</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-600 border-transparent hover:bg-green-100 text-xs py-0.5">On Track</Badge>
                )}
              </div>

              <div className="text-right text-xs text-gray-500 mb-2">₦{actualSpend.toLocaleString()} / ₦{budgetNum.toLocaleString()} ({(finPercent * 100).toFixed(1)}%)</div>
              
              {/* Stacked Progress Bar */}
              <div className="w-full h-8 flex rounded overflow-hidden mb-6">
                <div className="bg-[#2BA24D] h-full transition-all" style={{ width: `${actualPercent * 100}%` }}></div>
                <div className="bg-[#F59E0B] h-full transition-all" style={{ width: `${committedPercent * 100}%` }}></div>
                <div className="bg-[#E5E7EB] h-full transition-all" style={{ width: `${availablePercent * 100}%` }}></div>
              </div>

              {/* Progress Bar Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-3 h-3 rounded bg-[#2BA24D]"></div>
                  Actual Spent ({(actualPercent * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-3 h-3 rounded bg-[#F59E0B]"></div>
                  Committed Spent ({(committedPercent * 100).toFixed(1)}%)
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-3 h-3 rounded bg-[#E5E7EB]"></div>
                  Available ({(availablePercent * 100).toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-[#3B7CED] mb-6">Pending Requests</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Awaiting Approval</div>
                  <div className="text-2xl font-bold text-gray-800">{pendingAdjsList.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-gray-800">₦{pendingAdjsTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Spend by Category - 100% Perfect Circle Donut Chart */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-medium text-[#3B7CED]">Spend by Category</h3>
                <span className="text-xs text-gray-400 font-medium">Breakdown</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative">
                {/* Fixed Square 1:1 Aspect Ratio Container Guaranteed to be a Perfect Circle */}
                <div className="w-[180px] h-[180px] shrink-0 relative flex items-center justify-center">
                  <PieChart width={180} height={180}>
                    <Pie
                      data={pieChartData.length > 0 ? pieChartData : [{ name: "No Data", value: 1, color: "#E5E7EB" }]}
                      cx={90}
                      cy={90}
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={pieChartData.length > 1 ? 3 : 0}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {(pieChartData.length > 0 ? pieChartData : [{ name: "No Data", value: 1, color: "#E5E7EB" }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any) => [
                        `${Number(val).toFixed(1)}%`,
                        name
                      ]}
                      contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    />
                  </PieChart>
                  {/* Center Stat inside the Donut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Share</span>
                    <span className="text-sm font-bold text-gray-800">100%</span>
                  </div>
                </div>

                {/* Legend */}
                {pieChartData.length > 0 ? (
                  <div className="flex flex-col gap-2.5 flex-1 min-w-0 w-full sm:w-auto">
                    {pieChartData.map((entry, index) => {
                      const pct = Number(entry.percentage || entry.value || 0).toFixed(1);
                      return (
                        <div key={index} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-gray-700 font-medium capitalize truncate">{entry.name}</span>
                          </div>
                          <div className="flex items-center shrink-0">
                            <span className="text-gray-900 font-semibold text-xs min-w-[42px] text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400 py-4 flex-1">
                    No category spend data available
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mt-4">
          <button 
            className={`pb-3 text-sm font-medium ${activeTab === 'phases' ? 'text-[#3B7CED] border-b-2 border-[#3B7CED]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('phases')}
          >
            Phases & Activities
          </button>
          <button 
            className={`pb-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'adjustments' ? 'text-[#3B7CED] border-b-2 border-[#3B7CED]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('adjustments')}
          >
            <span>Budget Adjustments</span>
            {pendingBudgetsCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-[#EF4444] rounded-full shadow-xs leading-none">
                {pendingBudgetsCount > 99 ? "99+" : pendingBudgetsCount}
              </span>
            )}
          </button>
          <button 
            className={`pb-3 text-sm font-medium ${activeTab === 'documents' ? 'text-[#3B7CED] border-b-2 border-[#3B7CED]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents & Links
          </button>
          <button 
            className={`pb-3 text-sm font-medium ${activeTab === 'settings' ? 'text-[#3B7CED] border-b-2 border-[#3B7CED]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tabs Content */}
        <div className="relative min-h-[250px] w-full mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'phases' && (
          <div data-wizard="pc-phases-table" className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden mb-12">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-[#3B7CED]">Project Phases & Activities</h3>
              <Link href={`/project-costing/${project.id}/phases`}>
                <Button variant="outline" size="sm" className="text-xs">See more</Button>
              </Link>
            </div>
            <Table>
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow className="hover:bg-gray-50 border-0">
                  <TableHead className="w-[80px] font-semibold text-gray-600 py-3 text-center pl-4">S/N</TableHead>
                  <TableHead className="min-w-[320px] font-semibold text-gray-600 py-3">Activity</TableHead>
                  <TableHead className="w-[120px] font-semibold text-gray-600 py-3">Quantity</TableHead>
                  <TableHead className="w-[140px] font-semibold text-gray-600 py-3">Rate</TableHead>
                  <TableHead className="w-[160px] font-semibold text-gray-600 py-3">
                    {hasAdjustments ? "Amount (Original)" : "Amount"}
                  </TableHead>
                  {hasAdjustments && (
                    <>
                      <TableHead className="w-[160px] font-semibold text-gray-600 py-3">Approved Revision</TableHead>
                      <TableHead className="w-[160px] font-semibold text-gray-600 py-3">Current Budget</TableHead>
                    </>
                  )}
                  {customColumns.map(col => (
                    <TableHead key={col} className="font-semibold text-gray-600 py-3 whitespace-nowrap">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedPhases && parsedPhases.length > 0 ? (
                  renderPhaseRows(parsedPhases)
                ) : (
                  <TableRow>
                    <TableCell colSpan={hasAdjustments ? 7 + customColumns.length : 5 + customColumns.length} className="text-center py-6 text-gray-500">
                      No phases data available for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end p-4 bg-gray-50 border-t border-gray-200">
              <div className="text-gray-600 text-sm flex flex-wrap items-center gap-6">
                {hasAdjustments && (
                  <>
                    <div>
                      Original Budget: <span className="font-semibold text-gray-800 ml-1">₦{originalBudgetNum.toLocaleString()}</span>
                    </div>
                    <div>
                      Approved Revision: <span className={`font-semibold ml-1 ${totalApprovedRevision >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {totalApprovedRevision >= 0 ? "+" : ""}₦{totalApprovedRevision.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  Total Project Budget: <span className="text-xl font-semibold text-gray-800 ml-2">₦{budgetNum.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div data-wizard="pc-adjustments-content" className="flex flex-col gap-6 mb-12">
            
            {/* Original Budget Box */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-2">
              <div className="text-sm font-medium text-gray-800 mb-2">Original Approved Budget</div>
              <div className="text-3xl font-normal text-[#3B7CED]">₦{originalBudgetNum.toLocaleString()}</div>
            </div>

            {/* Pending Approval Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#3B7CED] font-medium text-base flex items-center gap-2">
                  <span>Pending Approval</span>
                  {pendingBudgetsCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-[#EF4444] rounded-full shadow-xs leading-none">
                      {pendingBudgetsCount > 99 ? "99+" : pendingBudgetsCount}
                    </span>
                  )}
                </h3>
                <span className="text-xs text-[#3B7CED] cursor-pointer hover:underline">See more</span>
              </div>

              {isLoadingAdjustments ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg bg-white shadow-sm p-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-5 w-32 bg-gray-100" />
                          <Skeleton className="h-3 w-48 bg-gray-100" />
                        </div>
                        <Skeleton className="h-6 w-24 bg-gray-100" />
                      </div>
                      <Skeleton className="h-10 w-full bg-gray-50 rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : budgetAdjustments && budgetAdjustments.filter((a: any) => ["PENDING", "PENDING_APPROVAL", "DRAFT"].includes(a.status?.toUpperCase())).length > 0 ? (
                <div className="flex flex-col gap-6">
                  {budgetAdjustments
                    .filter((a: any) => ["PENDING", "PENDING_APPROVAL", "DRAFT"].includes(a.status?.toUpperCase()))
                    .map((adj: any, i: number) => {
                      const totalAdj = Number(adj.total_adjustment || adj.amount || 0);
                      const lines = adj.lines && adj.lines.length > 0 ? adj.lines : [
                        {
                          adjustment_type: "NEW",
                          activity_name: adj.reason || "Planning Phase Activity",
                          reason: "Budget line adjustment",
                          adjustment_amount: totalAdj
                        }
                      ];
                      
                      return (
                        <div key={i} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                          {/* Top Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                              <div className="text-base font-semibold text-gray-800">
                                Adjustment {adj.reference_no || `ADJ-00${i + 1}`}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Submitted by {adj.requested_by_name || "John Doe"} on {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : "5/20/2026"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-0.5">Total Adjustment</div>
                              <div className={`text-xl font-bold ${totalAdj >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {totalAdj >= 0 ? "+" : ""}₦{totalAdj.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Line Items Section */}
                          <div className="p-6 border-b border-gray-100">
                            <div 
                              className="flex justify-between items-center cursor-pointer mb-4"
                              onClick={() => setIsAdjExpanded(!isAdjExpanded)}
                            >
                              <span className="text-sm font-medium text-gray-700">{lines.length} Adjustment Line Item{lines.length > 1 ? "s" : ""}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform ${isAdjExpanded ? "rotate-180" : ""}`} />
                            </div>
                            
                            {isAdjExpanded && (
                              <div className="flex flex-col gap-3">
                                {lines.map((line: any, idx: number) => {
                                  const isDecrease = line.direction?.toUpperCase() === "DECREASE" || Number(line.adjustment_amount || line.amount || 0) < 0;
                                  const rawAmt = Math.abs(Number(line.rate ? (Number(line.quantity || 1) * Number(line.rate)) : (line.adjustment_amount || line.amount || totalAdj)));
                                  const lineAmt = isDecrease ? -rawAmt : rawAmt;
                                  const linePhase =
                                    line.phase_name ||
                                    line.phase_details?.name ||
                                    line.phase ||
                                    (parsedPhases.find((p: any) =>
                                      p.activities?.some(
                                        (a: any) =>
                                          String(a.id) === String(line.activity) ||
                                          String(a.name) === String(line.activity_name)
                                      )
                                    )?.name) ||
                                    "General Phase";

                                  return (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-sm font-semibold text-gray-800">{linePhase}</span>
                                          <Badge variant="outline" className="text-[11px] font-normal text-gray-500 border-gray-200 px-2.5 py-0.5 rounded-full">
                                            {line.adjustment_type === "NEW" ? "New Activity" : "Existing Activity"}
                                          </Badge>
                                          {line.direction && (
                                            <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full border-0 ${
                                              isDecrease ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            }`}>
                                              {line.direction}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs text-gray-500">
                                          {line.activity_name || line.activity_details?.name || "Activity"} {line.quantity && line.rate ? `• Qty: ${line.quantity} @ ₦${Number(line.rate).toLocaleString()}` : (line.reason ? `• ${line.reason}` : "")}
                                        </span>
                                        <span className={`text-sm font-bold ${lineAmt >= 0 ? "text-green-600" : "text-red-500"}`}>
                                          {lineAmt >= 0 ? "+" : ""}₦{lineAmt.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Summary Calculation Section */}
                          <div className="p-6 border-b border-gray-100 bg-gray-50/40 text-xs text-gray-600 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span>Original Budget:</span>
                              <span className="font-semibold text-gray-800">₦{budgetNum.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Proposed Budget Change:</span>
                              <span className="font-semibold text-gray-800">₦{totalAdj.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-bold text-[#3B7CED]">
                              <span>Proposed Total Budget:</span>
                              <span>₦{(budgetNum + totalAdj).toLocaleString()}.00</span>
                            </div>
                          </div>

                          {/* Action Buttons Section */}
                          <div className="p-4 bg-white flex gap-4">
                            <PermissionGuard module="project_costing" entitlement="reject_budget">
                              <Button
                                variant="destructive"
                                className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white font-medium h-11 rounded-md"
                                disabled={isRejecting}
                              >
                                Reject
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard module="project_costing" entitlement="approve_budget">
                              <Button
                                className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white font-medium h-11 rounded-md"
                                onClick={() => handleApproveAdjustment(adj)}
                                disabled={isApprovingBudget}
                              >
                                Approve
                              </Button>
                            </PermissionGuard>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-6 text-center text-gray-500">
                  <p>No pending adjustments available.</p>
                </div>
              )}
            </div>

            {/* Completed Adjustment Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[#3B7CED] font-medium text-base">Completed Adjustment</h3>
                <span className="text-xs text-[#3B7CED] cursor-pointer hover:underline">See more</span>
              </div>

              {isLoadingAdjustments ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg bg-white shadow-sm p-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-5 w-32 bg-gray-100" />
                          <Skeleton className="h-3 w-48 bg-gray-100" />
                        </div>
                        <Skeleton className="h-6 w-24 bg-gray-100" />
                      </div>
                      <Skeleton className="h-10 w-full bg-gray-50 rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : budgetAdjustments && budgetAdjustments.filter((a: any) => ["APPROVED", "COMPLETED"].includes(a.status?.toUpperCase())).length > 0 ? (
                <div className="flex flex-col gap-6">
                  {budgetAdjustments
                    .filter((a: any) => ["APPROVED", "COMPLETED"].includes(a.status?.toUpperCase()))
                    .map((adj: any, i: number) => {
                      const totalAdj = Number(adj.total_adjustment || adj.amount || 0);
                      const lines = adj.lines && adj.lines.length > 0 ? adj.lines : [
                        {
                          adjustment_type: "NEW",
                          activity_name: adj.reason || "Planning Phase Activity",
                          reason: "Budget line adjustment",
                          adjustment_amount: totalAdj
                        }
                      ];

                      return (
                        <div key={i} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                          {/* Top Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-semibold text-gray-800">
                                    Adjustment {adj.reference_no || `ADJ-00${i + 1}`}
                                  </span>
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium text-xs px-2.5 py-0.5 rounded-full border-0">
                                    Approved
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Submitted by {adj.requested_by_name || "John Doe"} on {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : "5/20/2026"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-0.5">Total Adjustment</div>
                              <div className={`text-xl font-bold ${totalAdj >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {totalAdj >= 0 ? "+" : ""}₦{totalAdj.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Line Items Section */}
                          <div className="p-6 border-b border-gray-100">
                            <div 
                              className="flex justify-between items-center cursor-pointer mb-4"
                              onClick={() => setIsAdjExpanded(!isAdjExpanded)}
                            >
                              <span className="text-sm font-medium text-gray-700">{lines.length} Adjustment Line Item{lines.length > 1 ? "s" : ""}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform ${isAdjExpanded ? "rotate-180" : ""}`} />
                            </div>
                            
                            {isAdjExpanded && (
                              <div className="flex flex-col gap-3">
                                {lines.map((line: any, idx: number) => {
                                  const isDecrease = line.direction?.toUpperCase() === "DECREASE" || Number(line.adjustment_amount || line.amount || 0) < 0;
                                  const rawAmt = Math.abs(Number(line.rate ? (Number(line.quantity || 1) * Number(line.rate)) : (line.adjustment_amount || line.amount || totalAdj)));
                                  const lineAmt = isDecrease ? -rawAmt : rawAmt;
                                  const linePhase =
                                    line.phase_name ||
                                    line.phase_details?.name ||
                                    line.phase ||
                                    (parsedPhases.find((p: any) =>
                                      p.activities?.some(
                                        (a: any) =>
                                          String(a.id) === String(line.activity) ||
                                          String(a.name) === String(line.activity_name)
                                      )
                                    )?.name) ||
                                    "General Phase";

                                  return (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-sm font-semibold text-gray-800">{linePhase}</span>
                                          <Badge variant="outline" className="text-[11px] font-normal text-gray-500 border-gray-200 px-2.5 py-0.5 rounded-full">
                                            {line.adjustment_type === "NEW" ? "New Activity" : "Existing Activity"}
                                          </Badge>
                                          {line.direction && (
                                            <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full border-0 ${
                                              isDecrease ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            }`}>
                                              {line.direction}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs text-gray-500">
                                          {line.activity_name || line.activity_details?.name || "Activity"} {line.quantity && line.rate ? `• Qty: ${line.quantity} @ ₦${Number(line.rate).toLocaleString()}` : (line.reason ? `• ${line.reason}` : "")}
                                        </span>
                                        <span className={`text-sm font-bold ${lineAmt >= 0 ? "text-green-600" : "text-red-500"}`}>
                                          {lineAmt >= 0 ? "+" : ""}₦{lineAmt.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Summary Calculation Section */}
                          <div className="p-6 border-b border-gray-100 bg-gray-50/40 text-xs text-gray-600 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span>Original Budget:</span>
                              <span className="font-semibold text-gray-800">₦{budgetNum.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Current Budget:</span>
                              <span className="font-semibold text-gray-800">₦{(budgetNum + totalAdj).toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-bold text-[#3B7CED]">
                              <span>New Calculated Budget:</span>
                              <span>₦{(budgetNum + totalAdj).toLocaleString()}.00</span>
                            </div>
                          </div>

                          {/* Bottom Status Section */}
                          <div className="p-4 bg-white flex justify-center items-center gap-2 text-sm font-medium text-green-600">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>Approved</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-6 text-center text-gray-500">
                  <p>No completed adjustments available.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div data-wizard="pc-documents-content" className="bg-white rounded shadow-sm border border-gray-100 p-6 mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#3B7CED]">Project Documents & Links</h3>
              {project?.status?.toUpperCase() !== "CLOSED" && (
                <Button
                  onClick={() => setIsAddDocumentModalOpen(true)}
                  size="sm"
                  className="bg-[#3B7CED] hover:bg-[#3065c3] text-white flex items-center gap-1 text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Document
                </Button>
              )}
            </div>
            
            {(!(project as any).documents || (Array.isArray((project as any).documents) && (project as any).documents.length === 0)) ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded text-gray-500">
                <p>No documents have been added to this project yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray((project as any).documents) ? (project as any).documents.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded hover:border-[#3B7CED] transition-colors bg-gray-50">
                    <div className="flex flex-col truncate pr-4">
                      <span className="font-medium text-sm text-gray-800 truncate">{doc.name || `Document ${i + 1}`}</span>
                      {doc.created_at && (
                        <span className="text-xs text-gray-500 mt-1">Added: {new Date(doc.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <a
                      href={doc.file || doc.file_url || doc.url || doc.document || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-[#3B7CED] hover:bg-blue-50 shrink-0 font-medium"
                    >
                      View
                    </a>
                  </div>
                )) : (
                  <div className="text-sm text-gray-700">
                    {/* Fallback if documents is just a string (e.g. from broken Swagger schema) */}
                    {String((project as any).documents)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div data-wizard="pc-settings-content" className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 mb-12 shadow-sm">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Project Budget & Costing Settings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure budget adjustment permissions and policies for this project.
              </p>
            </div>

            <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/50 flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-gray-800 text-base">Allow Budget Decrease</span>
                  <Badge
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 ${
                      (projectSettings?.allow_budget_decrease ?? project?.allow_budget_decrease ?? true)
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {(projectSettings?.allow_budget_decrease ?? project?.allow_budget_decrease ?? true)
                      ? "Enabled"
                      : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  When enabled, users and project managers can create budget adjustment requests that decrease individual activity or overall project allocations. When disabled, only budget increases or non-decreasing adjustments are permitted.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 pt-1">
                {isUpdatingSettings && <Loader2 className="w-4 h-4 animate-spin text-[#3B7CED]" />}
                <Switch
                  checked={projectSettings?.allow_budget_decrease ?? project?.allow_budget_decrease ?? true}
                  disabled={isUpdatingSettings || isLoadingSettings}
                  className="data-[state=checked]:bg-[#3B7CED] data-[state=unchecked]:bg-gray-200"
                  onCheckedChange={async (checked) => {
                    try {
                      await updateProjectSettings({
                        id: Number(id),
                        body: { allow_budget_decrease: checked },
                      }).unwrap();
                      await refetchSettings();
                      refetch();
                      statusModal.showSuccess(
                        "Settings Updated",
                        `Budget decrease has been ${checked ? "enabled" : "disabled"} for this project.`
                      );
                    } catch (err) {
                      console.error(err);
                      statusModal.showError(
                        "Update Failed",
                        "Failed to update project settings. Please try again."
                      );
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Recent transactions */}
        <div data-wizard="pc-transactions-table" className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-[#3B7CED]">Recent transactions</h3>
            <Link href={`/project-costing/${project?.id || id}/transactions`}>
              <span className="text-xs text-[#3B7CED] cursor-pointer hover:underline">See more</span>
            </Link>
          </div>
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="hover:bg-gray-50 border-0">
                <TableHead className="font-medium text-gray-500 py-3 px-4">Date</TableHead>
                <TableHead className="font-medium text-gray-500 py-3">Record ID</TableHead>
                <TableHead className="font-medium text-gray-500 py-3">Category</TableHead>
                <TableHead className="font-medium text-gray-500 py-3">Amount</TableHead>
                <TableHead className="font-medium text-gray-500 py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransactions ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-gray-100">
                    <TableCell className="py-3 px-4"><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-40 bg-gray-100" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-6 w-20 bg-gray-100 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 6).map((tx: any, idx: number) => {
                  const dateStr = tx.date || tx.created_at ? new Date(tx.date || tx.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) : "-";
                  const primaryRef = tx.detail?.reference_id || tx.detail?.request_id;
                  const mainRef = tx.reference_id || tx.record_id || tx.recordId || tx.reference_no || tx.reference || tx.ref;

                  const recordId = primaryRef || mainRef || (tx.id ? (String(tx.id).startsWith("#") || String(tx.id).includes("-") ? String(tx.id) : `PjR-${tx.id}`) : "-");
                  const subRef = (primaryRef && mainRef && String(primaryRef) !== String(mainRef)) ? mainRef : null;
                  const catStr = formatCategory(tx.category || tx.type || tx.request_type || tx.project_type || "-");
                  const amountVal = extractAmount(tx);
                  const amountStr = `₦${Number(amountVal).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  const statusStr = tx.status || "Approved";
                  const statusLower = statusStr.toLowerCase();

                  let badgeClass = "bg-gray-150 text-gray-700";
                  if (statusLower.includes("approv") || statusLower === "done" || statusLower === "success" || statusLower === "released") {
                    badgeClass = "bg-[#E2F2E9] text-[#1E8E3E]";
                  } else if (statusLower === "paid" || statusLower === "invoice") {
                    badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
                  } else if (statusLower.includes("cancel") || statusLower.includes("reject")) {
                    badgeClass = "bg-[#FCE8E6] text-[#C5221F]";
                  } else if (statusLower.includes("pend")) {
                    badgeClass = "bg-[#FFF2CC] text-[#D66011]";
                  } else if (statusLower === "draft") {
                    badgeClass = "bg-[#E8F0FE] text-[#1A73E8]";
                  }

                  return (
                    <TableRow 
                      key={tx.id || idx} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setIsTransactionModalOpen(true);
                      }}
                    >
                      <TableCell className="py-3 px-4 text-sm text-gray-600">
                        {dateStr}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-800 font-semibold">
                        <span>{recordId}</span>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        {catStr}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-800 font-semibold">
                        {amountStr}
                      </TableCell>
                      <TableCell className="py-3 text-sm">
                        <Badge className={`border-none font-semibold px-2.5 py-0.5 rounded-full text-xs hover:bg-opacity-80 transition-all capitalize ${badgeClass}`}>
                          {statusStr}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No recent transactions recorded for this project yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>
      </div>


      <AddBudgetAdjustmentModal
        isOpen={isBudgetAdjustmentModalOpen}
        onClose={() => {
          setIsBudgetAdjustmentModalOpen(false);
          refetch();
        }}
        project={project}
      />

      <AddDocumentModal
        isOpen={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        projectId={Number(id)}
      />
      
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={statusModal.type === "success" ? "Done" : "Try again"}
      />

      <TransactionDetailsModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />

      {/* Hidden Export Template */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none">
        <div ref={exportRef}>
          <ProjectCostingExportTemplate 
            project={project} 
            transactions={transactions}
            parsedPhases={parsedPhases}
            customColumns={customColumns}
            budgetNum={budgetNum}
            actualSpend={actualSpend}
            committedSpend={committed}
            lineChartData={dynamicLineChartData}
            pieChartData={pieChartData}
          />
        </div>
      </div>
      <ModuleWizard moduleId="project-costing" />
    </div>
    </PageGuard>
  );
}
