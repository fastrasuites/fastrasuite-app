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
import { ProjectCostingExportTemplate, ExportDocType, categorizeTransactions } from "@/components/project-costing/export/ProjectCostingExportTemplate";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageGuard } from "@/components/auth/PageGuard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ModuleWizard, WizardGuideButton } from "@/components/shared/wizard/ModuleWizard";
import { TransactionDetailsModal } from "@/components/project-costing/modals/TransactionDetailsModal";
import { extractAmount, formatCategory } from "@/components/project-costing/TransactionHistoryTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { 
  ArrowLeft, 
  RefreshCw, 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  FileSpreadsheet, 
  Edit, 
  Lock,
  ShoppingBag,
  Receipt,
  CreditCard,
  BookOpen,
  Layers,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { 
  useGetProjectCostingProjectQuery,
  useApproveProjectMutation,
  useRejectProjectMutation,
  useSubmitProjectMutation,
  useDeleteProjectCostingProjectMutation,
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

const formatYAxisNaira = (val: number): string => {
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
    return `₦${Math.round(val / 1_000)}k`;
  }
  return `₦${val.toLocaleString()}`;
};

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
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [showActual, setShowActual] = useState(true);
  const [showCommitted, setShowCommitted] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
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
  const [timeGranularity, setTimeGranularity] = useState<"monthly" | "weekly">("monthly");
  const [commitmentViewMode, setCommitmentViewMode] = useState<"active" | "monthly">("active");
  const [showCompletedDemo, setShowCompletedDemo] = useState(false);

  const { fullName: loggedInUserName } = useCurrentUser();

  const { isProjectAccessible, planName } = useSubscriptionLimits();
  const isAccessible = !id || isProjectAccessible(Number(id));

  const { data: project, isLoading, error, refetch } = useGetProjectCostingProjectQuery(
    Number(id),
    { skip: !id || !isAccessible }
  );

  const { data: budgetAdjustments, isLoading: isLoadingAdjustments, refetch: refetchAdjustments } = useGetBudgetAdjustmentsQuery(
    Number(id),
    { skip: !id || !isAccessible }
  );

  const { data: rawTransactions, isLoading: isLoadingTransactions } = useGetProjectTransactionsQuery(
    Number(id),
    { skip: !id || !isAccessible }
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
    { skip: !id || !isAccessible }
  );
  const [updateProjectSettings, { isLoading: isUpdatingSettings }] = useUpdateProjectSettingsMutation();

  const statusModal = useStatusModal();

  const [approveProject, { isLoading: isApproving }] = useApproveProjectMutation();
  const [rejectProject, { isLoading: isRejecting }] = useRejectProjectMutation();
  const [submitProject, { isLoading: isSubmitting }] = useSubmitProjectMutation();
  const [approveBudgetAdjustment, { isLoading: isApprovingBudget }] = useApproveBudgetAdjustmentMutation();
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectCostingProjectMutation();

  const exportRef = React.useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportDocType, setExportDocType] = useState<ExportDocType>("all");

  // Resolve accurate Project Manager name
  const resolvedProjectManager = React.useMemo(() => {
    const pmDetails = project?.project_manager_details;
    if (pmDetails) {
      const fName = pmDetails.first_name?.trim();
      const lName = pmDetails.last_name?.trim();
      const combined = `${fName || ""} ${lName || ""}`.trim();
      if (combined && combined.toLowerCase() !== "admin") {
        return combined;
      }
      if (pmDetails.username && pmDetails.username.toLowerCase() !== "admin") {
        return pmDetails.username;
      }
    }

    if (typeof project?.project_manager === "string" && project.project_manager.trim() && project.project_manager.toLowerCase() !== "admin") {
      return project.project_manager.trim();
    }
    if (typeof project?.project_manager_name === "string" && project.project_manager_name.trim() && project.project_manager_name.toLowerCase() !== "admin") {
      return project.project_manager_name.trim();
    }

    if (loggedInUserName && loggedInUserName !== "Current User" && loggedInUserName.toLowerCase() !== "admin") {
      return loggedInUserName;
    }

    if (pmDetails?.email) {
      const prefix = pmDetails.email.split("@")[0];
      if (prefix.toLowerCase() !== "admin") {
        return prefix
          .split(/[._-]/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }

    return "Unassigned";
  }, [project, loggedInUserName]);

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

  const handleDeleteProject = () => {
    if (!project?.id) return;
    statusModal.showConfirm(
      "Delete Draft Project",
      `Are you sure you want to delete "${project.name || "this project"}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteProject(Number(project.id)).unwrap();
          statusModal.close();
          try {
            sessionStorage.setItem(
              "pc_deleted_msg",
              `Project "${project.name || "Draft project"}" has been deleted.`
            );
          } catch (e) {}
          router.push("/project-costing");
        } catch (err: any) {
          statusModal.showError(
            "Deletion Failed",
            err?.data?.message || err?.data?.detail || "Failed to delete the draft project. Please try again."
          );
        }
      },
      "Delete Project",
      "Cancel",
      "destructive"
    );
  };



  const docNameMap: Record<ExportDocType, string> = {
    all: "Complete_Project_Costing_Report",
    costing: "Project_Costing_Summary",
    wbs: "Work_Breakdown_Structure",
    po: "Purchase_Orders",
    bills: "Vendor_Bills_and_Invoices",
    disbursements: "Disbursements_Schedule",
    ledger: "Project_Account_Ledger",
  };

  const handleExportPdf = async (targetDocType: ExportDocType = "all") => {
    setIsExportingPdf(true);
    setExportDocType(targetDocType);
    try {
      // Allow DOM to re-render with the selected docType
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!exportRef.current) return;
      const element = exportRef.current;
      
      const pdf = new jsPDF("l", "mm", "a4");
      const margin = 10; // 10mm margin
      const usableWidth = 297 - (margin * 2); // 277mm A4 width (landscape)
      const pageHeight = 210; // 210mm A4 height (landscape)
      const usableHeight = pageHeight - (margin * 2); // 190mm

      const sectionElements = Array.from(element.querySelectorAll<HTMLElement>("[data-export-section='true']"));

      if (targetDocType === "all" && sectionElements.length > 0) {
        // Multi-page export section by section: Each major report section gets its own clean page!
        let isFirst = true;
        for (const sec of sectionElements) {
          const secCanvasWidth = sec.clientWidth || 1400;
          const secCanvasHeight = sec.clientHeight;
          const secImgData = await toJpeg(sec, {
            cacheBust: true,
            pixelRatio: 1.5,
            quality: 0.9,
            backgroundColor: '#ffffff'
          });

          const secImgHeight = (secCanvasHeight * usableWidth) / secCanvasWidth;

          if (!isFirst) {
            pdf.addPage();
          }
          isFirst = false;

          if (secImgHeight <= usableHeight) {
            pdf.addImage(secImgData, "JPEG", margin, margin, usableWidth, secImgHeight, undefined, "FAST");
          } else {
            // If section is taller than 1 page, paginate cleanly
            let heightLeft = secImgHeight;
            let position = 0;
            pdf.addImage(secImgData, "JPEG", margin, margin, usableWidth, secImgHeight, undefined, "FAST");
            heightLeft -= usableHeight;

            while (heightLeft > 0) {
              position = heightLeft - secImgHeight;
              pdf.addPage();
              pdf.addImage(secImgData, "JPEG", margin, position + margin, usableWidth, secImgHeight, undefined, "FAST");
              heightLeft -= usableHeight;
            }
          }
        }
      } else {
        // Single document export
        const canvasWidth = element.clientWidth || 1400;
        const canvasHeight = element.clientHeight;
        const imgData = await toJpeg(element, {
          cacheBust: true,
          pixelRatio: 1.5,
          quality: 0.9,
          backgroundColor: '#ffffff'
        });

        const imgHeight = (canvasHeight * usableWidth) / canvasWidth;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", margin, margin, usableWidth, imgHeight, undefined, "FAST");
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", margin, position + margin, usableWidth, imgHeight, undefined, "FAST");
          heightLeft -= usableHeight;
        }
      }

      const cleanProjectName = (project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`${cleanProjectName}_${docNameMap[targetDocType]}.pdf`);
      statusModal.showSuccess("Export Successful", `${docNameMap[targetDocType].replace(/_/g, " ")} PDF has been downloaded.`);
    } catch (err: any) {
      console.error("PDF export error", err);
      statusModal.showError("Export Failed", `Failed to generate PDF document: ${err.message || String(err)}`);
    } finally {
      setIsExportingPdf(false);
      setExportDocType("all");
    }
  };

  const handleExportImage = async (targetDocType: ExportDocType = "all") => {
    setIsExportingImage(true);
    setExportDocType(targetDocType);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (!exportRef.current) return;
      const element = exportRef.current;
      const image = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const cleanProjectName = (project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${cleanProjectName}_${docNameMap[targetDocType]}.png`;
      link.click();
      statusModal.showSuccess("Export Successful", "Visual image has been downloaded.");
    } catch (err: any) {
      console.error("Image export error", err);
      statusModal.showError("Export Failed", `Failed to export image: ${err.message || String(err)}`);
    } finally {
      setIsExportingImage(false);
      setExportDocType("all");
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

      let grandTotal = 0;
      if (parsedPhases && Array.isArray(parsedPhases)) {
        parsedPhases.forEach((phase: any, pIndex: number) => {
          const phaseSn = `${pIndex + 1}`;
          const phaseName = `"${(phase.name || `Phase ${pIndex + 1}`).replace(/"/g, '""')}"`;
          const phaseTotal = phase.activities?.reduce((sum: number, act: any) => sum + Number(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0), 0) || 0;
          grandTotal += phaseTotal;

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
              const amount = act.current_budget || act.amount || (Number(qty) * Number(rate)) || 0;

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

      // Grand Total Row
      const totalRow = ["", '"TOTAL WBS BUDGET"', "", "", "", grandTotal];
      if (customColumns && customColumns.length > 0) {
        customColumns.forEach(() => totalRow.push(""));
      }
      csvContent += totalRow.join(",") + "\n";

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

  const handleExportPoCsv = () => {
    try {
      const { poList } = categorizeTransactions(transactions, budgetNum);
      let csvContent = "\uFEFF";
      csvContent += `Project Costing - Purchase Orders Schedule\n`;
      csvContent += `Project Name: "${(project?.name || "Project").replace(/"/g, '""')}"\n`;
      csvContent += `Project Code: "${(project?.project_code || "N/A").replace(/"/g, '""')}"\n`;
      csvContent += `Export Date: "${new Date().toLocaleDateString("en-US")}"\n\n`;

      csvContent += `"S/N","Date","PO Ref ID","Vendor / Location","Description","Amount (NGN)","Status"\n`;
      
      let totalAmount = 0;
      poList.forEach((po, idx) => {
        totalAmount += Number(po.amount || 0);
        csvContent += `${idx + 1},"${po.date}","${po.ref}","${(po.vendor || "").replace(/"/g, '""')}","${(po.description || "").replace(/"/g, '""')}",${po.amount},"${po.status}"\n`;
      });

      csvContent += `,"","","TOTAL PURCHASE ORDERS",,${totalAmount},""\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${(project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_Purchase_Orders.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      statusModal.showSuccess("Export Successful", "Purchase Orders CSV file has been downloaded.");
    } catch (err: any) {
      console.error("PO CSV export error", err);
      statusModal.showError("Export Failed", `Failed to generate Purchase Orders CSV: ${err.message || String(err)}`);
    }
  };

  const handleExportBillsCsv = () => {
    try {
      const { billList } = categorizeTransactions(transactions, budgetNum);
      let csvContent = "\uFEFF";
      csvContent += `Project Costing - Vendor Bills & Invoices Schedule\n`;
      csvContent += `Project Name: "${(project?.name || "Project").replace(/"/g, '""')}"\n`;
      csvContent += `Project Code: "${(project?.project_code || "N/A").replace(/"/g, '""')}"\n`;
      csvContent += `Export Date: "${new Date().toLocaleDateString("en-US")}"\n\n`;

      csvContent += `"S/N","Date","Vendor Ref ID","Vendor / Contractor","Terms / Due Dates","Total Contract Value (NGN)","Settled Amount (NGN)","Outstanding Balance (NGN)","Bill Status"\n`;
      
      let totalContract = 0;
      let totalSettled = 0;
      billList.forEach((b, idx) => {
        totalContract += Number(b.totalAmount || 0);
        totalSettled += Number(b.paidAmount || 0);
        const outstanding = Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0));
        csvContent += `${idx + 1},"${b.date}","${b.billNo}","${(b.vendor || "").replace(/"/g, '""')}","${(b.dueDate || "").replace(/"/g, '""')}",${b.totalAmount},${b.paidAmount},${outstanding},"${b.status}"\n`;
      });

      const totalOutstanding = Math.max(0, totalContract - totalSettled);
      csvContent += `,"","","TOTAL CONTRACT VALUE & SETTLED",,${totalContract},${totalSettled},${totalOutstanding},""\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${(project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_Vendor_Bills_Invoices.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      statusModal.showSuccess("Export Successful", "Vendor Bills CSV file has been downloaded.");
    } catch (err: any) {
      console.error("Bills CSV export error", err);
      statusModal.showError("Export Failed", `Failed to generate Vendor Bills CSV: ${err.message || String(err)}`);
    }
  };

  const handleExportDisbursementsCsv = () => {
    try {
      const { disburseList } = categorizeTransactions(transactions, budgetNum);
      let csvContent = "\uFEFF";
      csvContent += `Project Costing - Disbursements Schedule & Audit\n`;
      csvContent += `Project Name: "${(project?.name || "Project").replace(/"/g, '""')}"\n`;
      csvContent += `Project Code: "${(project?.project_code || "N/A").replace(/"/g, '""')}"\n`;
      csvContent += `Export Date: "${new Date().toLocaleDateString("en-US")}"\n\n`;

      csvContent += `"S/N","Date","Disbursement Ref ID","Payee / Recipient","Channel / Mode","Disbursed Amount (NGN)","Status"\n`;
      
      let totalDisbursed = 0;
      disburseList.forEach((d, idx) => {
        totalDisbursed += Number(d.amount || 0);
        csvContent += `${idx + 1},"${d.date}","${d.voucherNo}","${(d.payee || "").replace(/"/g, '""')}","${(d.channel || "").replace(/"/g, '""')}",${d.amount},"${d.status}"\n`;
      });

      csvContent += `,"","","TOTAL DISBURSED",,${totalDisbursed},""\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${(project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_Disbursements_Schedule.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      statusModal.showSuccess("Export Successful", "Disbursements CSV file has been downloaded.");
    } catch (err: any) {
      console.error("Disbursements CSV export error", err);
      statusModal.showError("Export Failed", `Failed to generate Disbursements CSV: ${err.message || String(err)}`);
    }
  };

  const handleExportLedgerCsv = () => {
    try {
      const { ledgerList } = categorizeTransactions(transactions, budgetNum);
      let csvContent = "\uFEFF";
      csvContent += `Project Costing - Project Account General Ledger\n`;
      csvContent += `Project Name: "${(project?.name || "Project").replace(/"/g, '""')}"\n`;
      csvContent += `Project Code: "${(project?.project_code || "N/A").replace(/"/g, '""')}"\n`;
      csvContent += `Export Date: "${new Date().toLocaleDateString("en-US")}"\n\n`;

      csvContent += `"S/N","Date","Record Ref ID","Particulars / Activity","Category","Debit (NGN)","Credit (NGN)","Running Balance (NGN)","Status"\n`;
      
      let totalDebit = 0;
      let totalCredit = 0;
      let finalBalance = budgetNum;
      ledgerList.forEach((l, idx) => {
        totalDebit += Number(l.debit || 0);
        totalCredit += Number(l.credit || 0);
        finalBalance = l.runningBalance;
        csvContent += `${idx + 1},"${l.date}","${l.ref}","${(l.particulars || "").replace(/"/g, '""')}","${(l.category || "").replace(/"/g, '""')}",${l.debit},${l.credit},${l.runningBalance},"${l.status}"\n`;
      });

      csvContent += `,"","","TOTAL DEBIT / CREDIT",,${totalDebit},${totalCredit},${finalBalance},""\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${(project?.name || "Project").replace(/[^a-zA-Z0-9_-]/g, "_")}_Account_General_Ledger.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      statusModal.showSuccess("Export Successful", "Account Ledger CSV file has been downloaded.");
    } catch (err: any) {
      console.error("Ledger CSV export error", err);
      statusModal.showError("Export Failed", `Failed to generate Account Ledger CSV: ${err.message || String(err)}`);
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
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                <div className="w-full flex justify-between">
                  <Skeleton className="h-5 w-36 bg-gray-200" />
                </div>
                <Skeleton className="h-36 w-36 bg-gray-200 rounded-full" />
                <div className="grid grid-cols-3 gap-2 w-full pt-2">
                  <Skeleton className="h-6 w-full bg-gray-200" />
                  <Skeleton className="h-6 w-full bg-gray-200" />
                  <Skeleton className="h-6 w-full bg-gray-200" />
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

  // 1. Transaction extraction and normalization
  const txList = Array.isArray(transactions)
    ? transactions
    : Array.isArray((transactions as any)?.results)
    ? (transactions as any).results
    : Array.isArray((transactions as any)?.data)
    ? (transactions as any).data
    : [];

  // Helper to extract ISO date YYYY-MM-DD from transaction
  const getTxDateStr = (tx: any): string | null => {
    const raw =
      tx.date ||
      tx.created_at ||
      tx.detail?.date ||
      tx.detail?.created_at ||
      tx.date_consumed ||
      tx.detail?.date_consumed ||
      tx.date_created ||
      tx.created_on;
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  // Helper for Date Range filter matching
  const isTxInDateRange = (tx: any): boolean => {
    if (!fromDate && !toDate) return true;
    const dStr = getTxDateStr(tx);
    if (!dStr) return true;
    if (fromDate && dStr < fromDate) return false;
    if (toDate && dStr > toDate) return false;
    return true;
  };

  // Helper for Cost Category filter matching
  const matchesCostCategory = (tx: any, filter: string): boolean => {
    if (!filter || filter === "all") return true;
    const filterKey = filter.toLowerCase().replace(/[^a-z]/g, "");

    const rawCat = String(
      tx.category ||
      tx.request_type ||
      tx.type ||
      tx.detail?.category ||
      tx.detail?.request_type ||
      tx.record_type ||
      ""
    ).toLowerCase();

    const catClean = rawCat.replace(/[^a-z]/g, "");

    const ref = String(
      tx.reference_id ||
      tx.detail?.reference_id ||
      tx.detail?.request_id ||
      tx.record_id ||
      tx.recordId ||
      ""
    ).toLowerCase();

    if (filterKey.includes("labour") || filterKey.includes("labor")) {
      return catClean.includes("labour") || catClean.includes("labor") || ref.startsWith("lr-");
    }
    if (filterKey.includes("material")) {
      return catClean.includes("material") || ref.startsWith("mc-");
    }
    if (filterKey.includes("plant") || filterKey.includes("equipment")) {
      return catClean.includes("plant") || catClean.includes("equipment") || ref.startsWith("pe-") || ref.startsWith("per-");
    }
    if (filterKey.includes("subcontractor") || filterKey.includes("subcontract") || filterKey.includes("sub")) {
      return catClean.includes("subcontract") || catClean.includes("subcontractor") || catClean.includes("sub") || ref.startsWith("sr-") || ref.startsWith("scr-");
    }
    if (filterKey.includes("petty") || filterKey.includes("cash")) {
      return catClean.includes("petty") || catClean.includes("cash") || ref.startsWith("pcr-") || ref.startsWith("pc-");
    }
    if (filterKey.includes("purchase") || filterKey.includes("procure")) {
      return catClean.includes("purchase") || catClean.includes("procure") || ref.startsWith("pr-") || ref.startsWith("po-");
    }

    return catClean.includes(filterKey) || filterKey.includes(catClean);
  };

  const isTxActual = (tx: any): boolean => {
    const status = String(tx.status || tx.request_status || tx.release_status || "").toLowerCase();
    const type = String(tx.request_type || tx.category || tx.type || "").toLowerCase();
    return (
      type.includes("material_consumption") ||
      status === "disbursed" ||
      status === "paid" ||
      status === "released" ||
      status === "settled" ||
      status === "closed"
    );
  };

  const isTxCommitted = (tx: any): boolean => {
    const status = String(tx.status || tx.request_status || tx.release_status || "").toLowerCase();
    if (isTxActual(tx)) return false;
    if (status.includes("reject") || status.includes("cancel") || status.includes("void")) return false;
    return (
      status.includes("approv") ||
      status.includes("pend") ||
      status === "draft" ||
      status === "submitted" ||
      status === "under_review" ||
      status === "awaiting_approval" ||
      status === "in_review"
    );
  };

  const hasActiveFilter = costCategoryFilter !== "all" || Boolean(fromDate) || Boolean(toDate);

  // Filtered transactions based on currently active filters
  const filteredTransactions = txList.filter((tx: any) => {
    return isTxInDateRange(tx) && matchesCostCategory(tx, costCategoryFilter);
  });

  // Base overall project budget
  let totalProjectBudget = parseNumber(
    project?.budget ??
    project?.total_budget ??
    project?.contract_amount ??
    project?.total_amount ??
    project?.approved_budget ??
    0
  );

  if (project?.financials) {
    try {
      fin = typeof project.financials === "string" ? JSON.parse(project.financials) : project.financials;
      const finBudget = parseNumber(fin.budget ?? fin.total_budget ?? fin.total_amount ?? 0);
      if (finBudget > 0) totalProjectBudget = finBudget;

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

  if (totalProjectBudget === 0 && parsedPhases.length > 0) {
    totalProjectBudget = parsedPhases.reduce((acc, phase) => {
      return acc + (phase.activities || []).reduce((sum: number, act: any) => sum + parseNumber(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || act.budget || 0), 0);
    }, 0);
  }

  // Determine Budget for current view
  if (costCategoryFilter !== "all") {
    let catBudget = 0;
    if (fin?.category_breakdown && Array.isArray(fin.category_breakdown)) {
      const cat = fin.category_breakdown.find((c: any) => {
        const rType = String(c.request_type || c.category || c.name || "").toLowerCase().replace(/[^a-z]/g, "");
        const fKey = costCategoryFilter.toLowerCase().replace(/[^a-z]/g, "");
        return rType.includes(fKey) || fKey.includes(rType);
      });
      if (cat) {
        catBudget = parseNumber(cat.budget || cat.allocated_budget || cat.planned_amount || 0);
      }
    }

    if (catBudget === 0 && parsedPhases.length > 0) {
      for (const phase of parsedPhases) {
        if (phase.activities) {
          for (const act of phase.activities) {
            const actCat = String(act.cost_category || act.category || act.name || "").toLowerCase().replace(/[^a-z]/g, "");
            const fKey = costCategoryFilter.toLowerCase().replace(/[^a-z]/g, "");
            if (actCat.includes(fKey)) {
              catBudget += Number(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0);
            }
          }
        }
      }
    }

    budgetNum = catBudget > 0 ? catBudget : totalProjectBudget;
  } else {
    budgetNum = totalProjectBudget;
  }

  // Determine Actual Spend & Committed Cost
  if (hasActiveFilter) {
    let actSum = 0;
    let comSum = 0;
    filteredTransactions.forEach((tx: any) => {
      const amt = extractAmount(tx);
      if (isTxActual(tx)) {
        actSum += amt;
      } else if (isTxCommitted(tx)) {
        comSum += amt;
      }
    });

    if (actSum === 0 && costCategoryFilter !== "all" && !fromDate && !toDate && fin?.category_breakdown && Array.isArray(fin.category_breakdown)) {
      const cat = fin.category_breakdown.find((c: any) => {
        const rType = String(c.request_type || c.category || c.name || "").toLowerCase().replace(/[^a-z]/g, "");
        const fKey = costCategoryFilter.toLowerCase().replace(/[^a-z]/g, "");
        return rType.includes(fKey) || fKey.includes(rType);
      });
      if (cat) {
        actSum = parseNumber(cat.amount || cat.spent || cat.value || 0);
      }
    }

    actualSpend = actSum;
    committed = comSum;
  } else {
    let beActual = fin?.actual !== undefined ? parseNumber(fin.actual) : (fin?.spent !== undefined ? parseNumber(fin.spent) : parseNumber(project?.actual_spend ?? project?.spent ?? 0));
    let beCommitted = fin?.committed !== undefined ? parseNumber(fin.committed) : parseNumber(project?.committed_spend ?? project?.committed ?? 0);

    let txActSum = 0;
    let txComSum = 0;
    txList.forEach((tx: any) => {
      const amt = extractAmount(tx);
      if (isTxActual(tx)) txActSum += amt;
      else if (isTxCommitted(tx)) txComSum += amt;
    });

    actualSpend = (fin && (fin.actual !== undefined || fin.spent !== undefined)) ? beActual : (beActual > 0 ? beActual : txActSum);
    committed = (fin && fin.committed !== undefined) ? beCommitted : (beCommitted > 0 ? beCommitted : txComSum);

  }

  remaining = Math.max(0, budgetNum - actualSpend - committed);

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

  variance = hasActiveFilter || fin?.consumed_percent === undefined
    ? (budgetNum > 0 ? `${((actualSpend / budgetNum) * 100).toFixed(1)}%` : "0%")
    : `${Number(fin.consumed_percent).toFixed(1)}%`;

  const finPercent = budgetNum > 0 ? actualSpend / budgetNum : 0;
  const actualPercent = budgetNum > 0 ? Math.min(1, actualSpend / budgetNum) : 0;
  const committedPercent = budgetNum > 0 ? Math.min(1 - actualPercent, committed / budgetNum) : 0;
  const availablePercent = Math.max(0, 1 - actualPercent - committedPercent);

  let dynamicLineChartData: any[] = [];
  const chartBudget = budgetNum > 0 ? budgetNum : (actualSpend + committed > 0 ? (actualSpend + committed) : 949815926);

  // Helper for Date Range filter
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    if (!fromDate && !toDate) return true;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const dStr = d.toISOString().split("T")[0];
      if (fromDate && dStr < fromDate) return false;
      if (toDate && dStr > toDate) return false;
      return true;
    } catch {
      return true;
    }
  };

  // 1. Check if backend provided a real time-series array in financials or project
  const backendTimeline = fin?.spend_over_time || fin?.monthly_spend || fin?.spend_history || project?.spend_over_time;

  // COMPLETED PROJECT DEMO GENERATOR (Shows how the chart looks at 100% completion)
  if (showCompletedDemo) {
    const monthsRef = [
      { period: "Sep 2026", date: "2026-09-01", short: "Sep", actual: 0,             monthlyPo: 45000000,   activePo: 45000000 },
      { period: "Oct 2026", date: "2026-10-01", short: "Oct", actual: 20000000,      monthlyPo: 423821000,  activePo: 423821000 },
      { period: "Nov 2026", date: "2026-11-01", short: "Nov", actual: 145000000,     monthlyPo: 180000000,  activePo: 265000000 },
      { period: "Dec 2026", date: "2026-12-01", short: "Dec", actual: 165000000,     monthlyPo: 535000000,  activePo: 540000000 }, // Second major surge!
      { period: "Jan 2027", date: "2027-01-01", short: "Jan", actual: 340000000,     monthlyPo: 220000000,  activePo: 345000000 },
      { period: "Feb 2027", date: "2027-02-01", short: "Feb", actual: 445000000,     monthlyPo: 430000000,  activePo: 440000000 }, // Third surge!
      { period: "Mar 2027", date: "2027-03-01", short: "Mar", actual: 595000000,     monthlyPo: 190000000,  activePo: 300000000 },
      { period: "Apr 2027", date: "2027-04-01", short: "Apr", actual: 745000000,     monthlyPo: 140000000,  activePo: 210000000 },
      { period: "May 2027", date: "2027-05-01", short: "May", actual: 885000000,     monthlyPo: 95000000,   activePo: 110000000 },
      { period: "Jun 2027", date: "2027-06-01", short: "Jun", actual: 980000000,     monthlyPo: 195000000,  activePo: 195000000 }, // BREAKTHROUGH: Crosses ₦949.8M budget ceiling!
      { period: "Jul 2027", date: "2027-07-01", short: "Jul", actual: 1065000000,    monthlyPo: 45000000,   activePo: 45000000 },  // 12% over budget (₦1.065 Billion)
    ];

    const filteredDemo = monthsRef.filter(m => isDateInRange(m.date));

    if (timeGranularity === "weekly") {
      const weeklyDemo: any[] = [];
      filteredDemo.forEach((m, mIdx) => {
        const nextActual = mIdx < filteredDemo.length - 1 ? filteredDemo[mIdx + 1].actual : m.actual;
        const actualDelta = (nextActual - m.actual) / 4;
        const nextActivePo = mIdx < filteredDemo.length - 1 ? filteredDemo[mIdx + 1].activePo : m.activePo;
        const poDelta = (nextActivePo - m.activePo) / 4;

        for (let w = 1; w <= 4; w++) {
          const wActual = Math.round(m.actual + (actualDelta * w));
          const wActivePo = Math.round(m.activePo + (poDelta * w));
          const wMonthlyPo = w === 2 ? Math.round(m.monthlyPo * 0.7) : w === 4 ? Math.round(m.monthlyPo * 0.3) : 0;

          weeklyDemo.push({
            name: `W${w} ${m.short}`,
            fullName: `Week ${w}, ${m.period}`,
            planned: chartBudget,
            actual: wActual,
            committed: commitmentViewMode === "active" ? wActivePo : wMonthlyPo,
            date: m.date,
          });
        }
      });
      dynamicLineChartData = weeklyDemo;
    } else {
      dynamicLineChartData = filteredDemo.map(m => ({
        name: m.short,
        fullName: m.period,
        planned: chartBudget,
        actual: m.actual,
        committed: commitmentViewMode === "active" ? m.activePo : m.monthlyPo,
        date: m.date,
      }));
    }
  } else if (Array.isArray(backendTimeline) && backendTimeline.length > 0) {
    const totalActualSpend = parseNumber(fin?.actual ?? fin?.spent ?? fin?.actual_spend ?? actualSpend);
    const sumRawActual = backendTimeline.reduce((sum: number, it: any) => sum + parseNumber(it.actual ?? it.spent ?? 0), 0);
    const lastItemActual = parseNumber(backendTimeline[backendTimeline.length - 1]?.actual ?? backendTimeline[backendTimeline.length - 1]?.spent ?? 0);

    const backendIsMonthlyDelta = totalActualSpend > 0 && Math.abs(sumRawActual - totalActualSpend) < 1 && lastItemActual < totalActualSpend;

    if (timeGranularity === "weekly") {
      // WEEKLY VIEW DRILLDOWN: extract weekly_spend inside each month
      let runningCumulativeActual = 0;
      let runningCumulativeCommitted = 0;
      const weeklyPoints: any[] = [];

      backendTimeline.forEach((monthItem: any) => {
        const monthCommitted = parseNumber(monthItem.committed ?? monthItem.committed_spend ?? 0);
        runningCumulativeCommitted += monthCommitted;

        const weeks = Array.isArray(monthItem.weekly_spend) ? monthItem.weekly_spend : [];
        if (weeks.length > 0) {
          weeks.forEach((w: any) => {
            const weekEndDate = w.end_date || w.start_date || monthItem.date;
            if (!isDateInRange(weekEndDate)) return;

            const weekActual = parseNumber(w.amount ?? 0);
            runningCumulativeActual += weekActual;

            const activeCommitment = Math.max(0, runningCumulativeCommitted - runningCumulativeActual);
            const periodParts = String(monthItem.period || "").trim().split(" ");
            const shortMonth = periodParts[0] || "";

            weeklyPoints.push({
              name: `W${w.week} ${shortMonth}`,
              fullName: `Week ${w.week}, ${monthItem.period} (${w.start_date} – ${w.end_date})`,
              planned: chartBudget,
              actual: runningCumulativeActual,
              committed: commitmentViewMode === "active" ? activeCommitment : (w.week === 1 ? monthCommitted : 0),
              date: weekEndDate,
            });
          });
        } else {
          // If a month has no weekly breakdown, include the month as a single slot
          if (isDateInRange(monthItem.date)) {
            const rawActual = parseNumber(monthItem.actual ?? monthItem.spent ?? 0);
            runningCumulativeActual += rawActual;
            const activeCommitment = Math.max(0, runningCumulativeCommitted - runningCumulativeActual);
            weeklyPoints.push({
              name: monthItem.period,
              fullName: monthItem.full_name || monthItem.period,
              planned: chartBudget,
              actual: runningCumulativeActual,
              committed: commitmentViewMode === "active" ? activeCommitment : monthCommitted,
              date: monthItem.date,
            });
          }
        }
      });

      dynamicLineChartData = weeklyPoints;
    } else {
      // MONTHLY VIEW:
      let runningCumulativeActual = 0;
      let runningCumulativeCommitted = 0;

      const filteredTimeline = backendTimeline.filter((item: any) => isDateInRange(item.date));

      dynamicLineChartData = filteredTimeline.map((item: any) => {
        const monthCommitted = parseNumber(item.committed ?? item.committed_spend ?? item.committed_amount ?? 0);
        const rawActual = parseNumber(item.actual ?? item.spent ?? item.actual_spend ?? 0);

        if (backendIsMonthlyDelta) {
          runningCumulativeActual += rawActual;
        } else {
          runningCumulativeActual = rawActual;
        }

        runningCumulativeCommitted += monthCommitted;

        // Active Outstanding Commitment = Total committed to date minus settled actual spend
        // Stays up at active balance (e.g. ₦431.8M) until actual payments reduce it!
        const activeCommitment = Math.max(0, runningCumulativeCommitted - runningCumulativeActual);
        const displayedCommitted = commitmentViewMode === "active" ? activeCommitment : monthCommitted;

        const periodParts = String(item.period || "").trim().split(" ");
        const shortMonth = periodParts[0] || item.period || item.name;

        return {
          name: shortMonth,
          fullName: item.full_name || item.period || item.name,
          planned: parseNumber(item.budget ?? item.planned_budget ?? item.planned ?? chartBudget),
          actual: runningCumulativeActual,
          committed: displayedCommitted,
          date: item.date,
        };
      });
    }
  } else {
    // 2. Build time-series dynamically from project timeline & transaction records (Fallback)
    const start = project?.start_date ? new Date(project.start_date) : null;
    const end = project?.expected_end_date ? new Date(project.expected_end_date) : null;
    const hasValidStart = start && !isNaN(start.getTime());
    const hasValidEnd = end && !isNaN(end.getTime());
    const hasValidDates = hasValidStart && hasValidEnd && start < end;

    const monthDiff = hasValidDates
      ? (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1
      : 0;

    interface TimelineSlot {
      name: string;
      fullName: string;
      year: number;
      month: number;
      dateStr: string;
    }
    const slots: TimelineSlot[] = [];

    if (hasValidDates && monthDiff >= 2 && start) {
      for (let i = 0; i < monthDiff; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const dStr = d.toISOString().split("T")[0];
        if (isDateInRange(dStr)) {
          slots.push({
            name: d.toLocaleString("default", { month: "short" }),
            fullName: d.toLocaleString("default", { month: "long", year: "numeric" }),
            year: d.getFullYear(),
            month: d.getMonth(),
            dateStr: dStr,
          });
        }
      }
    } else {
      const baseYear = hasValidStart ? start!.getFullYear() : new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(baseYear, m, 1);
        const dStr = d.toISOString().split("T")[0];
        if (isDateInRange(dStr)) {
          slots.push({
            name: d.toLocaleString("default", { month: "short" }),
            fullName: d.toLocaleString("default", { month: "long", year: "numeric" }),
            year: baseYear,
            month: m,
            dateStr: dStr,
          });
        }
      }
    }

    // Bucket transaction records by month
    const monthlyActualMap = new Map<string, number>();
    const monthlyCommittedMap = new Map<string, number>();

    const chartTxSource = hasActiveFilter ? filteredTransactions : txList;
    if (chartTxSource && chartTxSource.length > 0) {
      chartTxSource.forEach((tx: any) => {
        const amt = extractAmount(tx);
        if (amt <= 0) return;

        const rawDate = tx.date || tx.created_at || tx.detail?.date || tx.detail?.created_at || tx.date_consumed;
        const d = rawDate ? new Date(rawDate) : null;
        if (!d || isNaN(d.getTime())) return;

        const slotKey = `${d.getFullYear()}-${d.getMonth()}`;
        const monthOnlyKey = `month-${d.getMonth()}`;

        if (isTxActual(tx)) {
          monthlyActualMap.set(slotKey, (monthlyActualMap.get(slotKey) || 0) + amt);
          monthlyActualMap.set(monthOnlyKey, (monthlyActualMap.get(monthOnlyKey) || 0) + amt);
        } else if (isTxCommitted(tx)) {
          monthlyCommittedMap.set(slotKey, (monthlyCommittedMap.get(slotKey) || 0) + amt);
          monthlyCommittedMap.set(monthOnlyKey, (monthlyCommittedMap.get(monthOnlyKey) || 0) + amt);
        }
      });
    }

    const hasTxData = monthlyActualMap.size > 0 || monthlyCommittedMap.size > 0;

    let cumulativeActual = 0;
    let cumulativeCommitted = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    dynamicLineChartData = slots.map((slot, idx) => {
      let monthActual = 0;
      let monthCommitted = 0;

      if (hasTxData) {
        const slotKey = `${slot.year}-${slot.month}`;
        const monthOnlyKey = `month-${slot.month}`;
        monthActual = monthlyActualMap.get(slotKey) ?? monthlyActualMap.get(monthOnlyKey) ?? 0;
        monthCommitted = monthlyCommittedMap.get(slotKey) ?? monthlyCommittedMap.get(monthOnlyKey) ?? 0;
        cumulativeActual += monthActual;
        cumulativeCommitted += monthCommitted;
      } else {
        const isPastOrCurrent = slot.year < currentYear || (slot.year === currentYear && slot.month <= currentMonth);
        if (isPastOrCurrent && (actualSpend > 0 || committed > 0)) {
          const progressFactor = Math.min(1, (idx + 1) / Math.max(1, currentMonth + 1));
          cumulativeActual = Math.round(actualSpend * progressFactor);
          monthCommitted = idx === 0 ? committed : 0;
          cumulativeCommitted = committed;
        }
      }

      const activeCommitment = Math.max(0, cumulativeCommitted - cumulativeActual);
      const displayedCommitted = commitmentViewMode === "active" ? activeCommitment : monthCommitted;

      return {
        name: slot.name,
        fullName: slot.fullName,
        planned: chartBudget,
        actual: cumulativeActual,
        committed: displayedCommitted,
        date: slot.dateStr,
      };
    });
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

  const isMaterialCategory = (catStr: string) => {
    const lower = String(catStr || "").toLowerCase().trim();
    return lower.includes("material_consumption") || lower.includes("material consumption") || lower === "material consumption";
  };

  // Filter out Material Consumption from rawCatList
  rawCatList = rawCatList.filter((cat: any) => {
    const key = cat.request_type || cat.name || cat.category || cat.type || "";
    return !isMaterialCategory(key);
  });

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
        let pct = 0;
        if (totalCatAmount > 0 && amt > 0) {
          pct = Math.round((amt / totalCatAmount) * 100);
        }

        const nameKey = cat.request_type || cat.name || cat.category || cat.type || "General";
        return {
          name: formatCostCategory(nameKey),
          amount: amt,
          percentage: pct,
          value: pct,
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
      const rawCat = tx.category || tx.request_type || tx.type || "General";
      if (isMaterialCategory(rawCat)) return;
      const cat = formatCostCategory(rawCat);
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
    <div className="flex flex-col min-h-screen bg-gray-50 relative pb-10">
      {/* Top Navigation Row */}
      <div className="flex items-center px-6 py-4">
        <Link href="/project-costing" className="flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {project.name}
        </Link>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        
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
            <div className="text-sm text-gray-800 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div>
                <span className="font-semibold text-gray-600">Client:</span>{" "}
                <span className="text-gray-900 font-medium">{project.client_name || "N/A"}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div>
                <span className="font-semibold text-gray-600">Project Manager:</span>{" "}
                <span className="text-gray-900 font-medium">{resolvedProjectManager}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div>
                <span className="font-semibold text-gray-600">Date:</span> {project.start_date || "N/A"} - {project.expected_end_date || "N/A"}
              </div>
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
                <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-xl border-gray-200 p-2 max-h-[85vh] overflow-y-auto">
                  {/* Master Reports */}
                  <DropdownMenuLabel className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                    Complete Master Report
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("all")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-xs text-gray-900">Complete Costing Report (PDF)</span>
                      <span className="text-[10px] text-gray-500">All sections, charts, tables & sign-offs</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportImage("all")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-50 focus:bg-blue-50"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-xs text-gray-900">Complete Report (Image / PNG)</span>
                      <span className="text-[10px] text-gray-500">High-resolution visual capture</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5" />

                  {/* Individual Document Visuals (PDF) */}
                  <DropdownMenuLabel className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                    Visual Documents (PDF)
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("costing")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-[#3B7CED] shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Project Costing Summary</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("po")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Purchase Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("bills")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Vendor Bills & Invoices</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("disbursements")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Disbursements Schedule</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("ledger")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Project Account Ledger</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleExportPdf("wbs")} 
                    disabled={isExportingPdf || isExportingImage} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Work Breakdown Structure (WBS)</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5" />

                  {/* Data Spreadsheets (CSV) */}
                  <DropdownMenuLabel className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                    Data Spreadsheets (CSV)
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={handleExportWbsCsv} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">WBS - CSV file</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportPoCsv} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Purchase Orders - CSV file</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportBillsCsv} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Vendor Bills - CSV file</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportDisbursementsCsv} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Disbursements - CSV file</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleExportLedgerCsv} 
                    className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-700">Account Ledger - CSV file</span>
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

            {(!project.status || project.status.toUpperCase() === "DRAFT") && (
              <PermissionGuard module="project_costing" action="delete" entitlement="delete_project">
                <Button 
                  onClick={handleDeleteProject}
                  disabled={isDeletingProject}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-9 flex items-center gap-1.5 px-3.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{isDeletingProject ? "Deleting..." : "Delete Project"}</span>
                </Button>
              </PermissionGuard>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Date Range</label>
                {(fromDate || toDate || costCategoryFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => { setFromDate(""); setToDate(""); setCostCategoryFilter("all"); }}
                    className="text-xs text-[#3B7CED] hover:underline font-medium cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
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
                  <SelectItem value="purchase">Purchase Orders / Requests</SelectItem>
                  <SelectItem value="material_consumption">Material Consumption</SelectItem>
                  <SelectItem value="labour">Labour</SelectItem>
                  <SelectItem value="plant_equipment">Plant &amp; Equipment</SelectItem>
                  <SelectItem value="sub_contractor">Sub Contractor</SelectItem>
                  <SelectItem value="petty_cash">Petty Cash</SelectItem>
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
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-[#3B7CED]">Spend Over Time vs Budget Curve</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeGranularity === "monthly" ? "Monthly" : "Weekly"} timeline comparing budget ceiling, committed obligations, and actual expenditure
                  </p>
                </div>
                
                {/* Controls: Granularity, Commitment View Mode, Demo Preview Toggle, and Series Toggle Pills */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  {/* Demo Completed State Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCompletedDemo(!showCompletedDemo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer select-none ${
                      showCompletedDemo
                        ? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs hover:bg-amber-100/70"
                        : "bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${showCompletedDemo ? "bg-amber-500 animate-pulse" : "bg-gray-300"}`} />
                    <span>{showCompletedDemo ? "Completed Project Preview (Active)" : "View Completed Preview"}</span>
                  </button>

                  {/* Granularity Toggle: Monthly vs Weekly */}
                  <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200/60 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setTimeGranularity("monthly")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                        timeGranularity === "monthly"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeGranularity("weekly")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                        timeGranularity === "weekly"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Weekly
                    </button>
                  </div>

                  {/* Commitment View Mode Filter */}
                  <Select value={commitmentViewMode} onValueChange={(v: any) => setCommitmentViewMode(v)}>
                    <SelectTrigger className="h-8 text-xs font-medium px-3 bg-white border-gray-200 w-[185px]">
                      <SelectValue placeholder="Commitment View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs">
                        Active Balance (Holds Up)
                      </SelectItem>
                      <SelectItem value="monthly" className="text-xs">
                        New POs (Monthly Flow)
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Series Toggle Pills */}
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
                    <span>Committed Amount</span>
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
                    <span>Project Budget</span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                      showPlanned ? "bg-[#3B7CED] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {showPlanned ? "✓" : "–"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="w-full h-[340px] min-h-[340px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicLineChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
                      tick={{ fill: '#6B7280', fontSize: 11 }} 
                      dy={10} 
                    />
                    <YAxis 
                      width={75}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }} 
                      tickFormatter={formatYAxisNaira} 
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0]?.payload;
                          const fullName = dataPoint?.fullName || label;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-xs min-w-[210px] space-y-1.5">
                              <p className="font-semibold text-gray-800 border-b border-gray-100 pb-1.5">{fullName}</p>
                              {payload.map((entry: any, index: number) => {
                                const isPlanned = entry.dataKey === "planned";
                                const isCommitted = entry.dataKey === "committed";
                                const color = isPlanned ? "#3B7CED" : isCommitted ? "#F59E0B" : "#2BA24D";
                                const name = isPlanned ? "Project Budget" : isCommitted ? "Committed Amount" : "Actual Spent";
                                const valNum = Number(entry.value || 0);
                                const value = entry.value !== null && entry.value !== undefined 
                                  ? `₦${valNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                  : "Not reached";
                                return (
                                  <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
                                    <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                      {name}:
                                    </span>
                                    <span className="font-semibold text-gray-900">{value}</span>
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
                        dot={false}
                        activeDot={{ r: 5, fill: '#3B7CED', stroke: '#fff', strokeWidth: 2 }} 
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
                        dot={false}
                        activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} 
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
                        dot={false}
                        activeDot={{ r: 5, fill: '#2BA24D', stroke: '#fff', strokeWidth: 2 }} 
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

            {/* Spend by Category - Complete Filled Pie Chart */}
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#3B7CED]">Spend by Category</h3>
                <span className="text-xs text-gray-400 font-medium">Breakdown</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 relative min-h-[180px]">
                {pieChartData.length > 0 ? (
                  <>
                    {/* Fixed Square 1:1 Aspect Ratio Container Guaranteed to be a Perfect Circle */}
                    <div className="w-[180px] h-[180px] shrink-0 relative flex items-center justify-center">
                      <PieChart width={180} height={180}>
                        <Pie
                          data={pieChartData}
                          cx={90}
                          cy={90}
                          innerRadius={0}
                          outerRadius={80}
                          paddingAngle={pieChartData.length > 1 ? 1.5 : 0}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          onMouseEnter={(_, index) => setHoveredCategoryIndex(index)}
                          onMouseLeave={() => setHoveredCategoryIndex(null)}
                        >
                          {pieChartData.map((entry, index) => {
                            const isHovered = hoveredCategoryIndex === index;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                fillOpacity={hoveredCategoryIndex === null || isHovered ? 1 : 0.35}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                className="transition-all duration-150 cursor-pointer"
                              />
                            );
                          })}
                        </Pie>
                      </PieChart>
                    </div>

                    {/* Legend at the bottom in a 3-column grid ("3 for 3") */}
                    <div className="grid grid-cols-3 gap-x-2.5 gap-y-2 w-full pt-3 border-t border-gray-100">
                      {pieChartData.map((entry, index) => {
                        const pct = Math.round(Number(entry.percentage || entry.value || 0));
                        const isHovered = hoveredCategoryIndex === index;
                        return (
                          <div 
                            key={index} 
                            onMouseEnter={() => setHoveredCategoryIndex(index)}
                            onMouseLeave={() => setHoveredCategoryIndex(null)}
                            className={`flex flex-col gap-0.5 p-1 rounded-md transition-all duration-150 cursor-pointer select-none min-w-0 ${
                              isHovered 
                                ? "bg-gray-50/90 scale-[1.03] shadow-2xs z-10" 
                                : hoveredCategoryIndex !== null 
                                ? "opacity-40" 
                                : "opacity-100 hover:bg-gray-50/60"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className={`w-2 h-2 rounded-full shrink-0 transition-transform ${isHovered ? "scale-115 ring-1.5 ring-offset-1 ring-gray-300" : ""}`} 
                                style={{ backgroundColor: entry.color }} 
                              />
                              <span 
                                className={`text-[11px] truncate transition-all ${
                                  isHovered 
                                    ? "font-semibold text-gray-800 scale-[1.02] origin-left" 
                                    : "font-normal text-gray-500"
                                }`}
                                title={entry.name}
                              >
                                {entry.name}
                              </span>
                            </div>
                            <div className="flex items-center pl-3.5">
                              <span className={`text-xs transition-all ${
                                isHovered 
                                  ? "font-bold text-gray-900 scale-[1.04] origin-left" 
                                  : "font-medium text-gray-700"
                              }`}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-xs text-gray-400 py-10 w-full">
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
                      const lines = adj.lines && adj.lines.length > 0 ? adj.lines : (adj.reason ? [
                        {
                          adjustment_type: "GENERAL",
                          activity_name: adj.reason,
                          reason: adj.reason,
                          adjustment_amount: totalAdj
                        }
                      ] : []);
                      
                      return (
                        <div key={i} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                          {/* Top Header */}
                          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                              <div className="text-base font-semibold text-gray-800">
                                Adjustment {adj.reference_no || `ADJ-00${i + 1}`}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Submitted by {adj.requested_by_name || adj.created_by?.username || adj.user?.username || adj.user || "User"} on {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : "-"}
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
                      const lines = adj.lines && adj.lines.length > 0 ? adj.lines : (adj.reason ? [
                        {
                          adjustment_type: "GENERAL",
                          activity_name: adj.reason,
                          reason: adj.reason,
                          adjustment_amount: totalAdj
                        }
                      ] : []);

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
                                  Submitted by {adj.requested_by_name || adj.created_by?.username || adj.user?.username || adj.user || "User"} on {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : "-"}
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
              ) : filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 6).map((tx: any, idx: number) => {
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
                  const statusStr = tx.status || "-";
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
                    {hasActiveFilter ? "No transactions found matching the selected filter criteria." : "No recent transactions recorded for this project yet."}
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
          refetchAdjustments?.();
        }}
        project={project}
        budgetAdjustments={budgetAdjustments}
        actualSpend={actualSpend}
        committedSpend={committed}
        remainingBudget={remaining}
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
        actionText={statusModal.actionText || (statusModal.type === "success" ? "Done" : "Try again")}
        onAction={statusModal.onAction}
        secondaryText={statusModal.secondaryText}
        onSecondary={statusModal.onSecondary || statusModal.close}
        actionVariant={statusModal.actionVariant}
      />

      <TransactionDetailsModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />

      {/* Hidden Export Template - Mounted strictly during export in an isolated fixed 0x0 container so it never creates blank page scrolling */}
      {(isExportingPdf || isExportingImage) && (
        <div 
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "1px",
            height: "1px",
            overflow: "hidden",
            pointerEvents: "none",
            opacity: 0,
            zIndex: -9999,
          }}
        >
          <div ref={exportRef} style={{ width: "1400px" }}>
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
              docType={exportDocType}
            />
          </div>
        </div>
      )}
      <ModuleWizard moduleId="project-costing" />
    </div>
    </PageGuard>
  );
}
