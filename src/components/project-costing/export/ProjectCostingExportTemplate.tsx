import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  FileText, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Clock
} from "lucide-react";
import { ProjectCostingProject } from "@/types/projectCosting";

export type ExportDocType = "all" | "costing" | "wbs" | "po" | "bills" | "disbursements" | "ledger";

export const formatCurrency = (amount: number | string) => {
  const num = Number(amount);
  if (isNaN(num)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
};

export const extractAmount = (tx: any): number => {
  if (!tx) return 0;
  const candidates = [
    tx?.detail?.project_request?.request_amount,
    tx?.detail?.contract_value,
    tx?.detail?.total_amount,
    tx?.detail?.projected_cost,
    tx?.detail?.amount_requested,
    tx?.detail?.estimated_cost,
    tx?.detail?.amount,
    tx?.detail?.total,
    tx?.detail?.subtotal,
    tx?.amount,
    tx?.total_amount,
    tx?.request_amount,
    tx?.actual_amount,
    tx?.cost,
    tx?.total,
    tx?.subtotal,
    tx?.value,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== "") {
      const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
      if (!isNaN(parsed)) return parsed;
    }
  }

  if (Array.isArray(tx?.detail?.lines) && tx.detail.lines.length > 0) {
    const sum = tx.detail.lines.reduce((acc: number, line: any) => {
      const lineAmt =
        line.total_cost ??
        line.line_total ??
        line.total_amount ??
        line.amount ??
        line.subtotal ??
        Number(line.quantity || line.hours || 0) *
          Number(line.unit_cost || line.estimated_unit_cost || line.unit_price || line.hourly_rate || line.rate || 0);
      const num = typeof lineAmt === "number" ? lineAmt : parseFloat(String(lineAmt).replace(/[^0-9.-]/g, ""));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    if (sum > 0) return sum;
  }

  return 0;
};

export const getActualReferenceId = (tx: any): string => {
  if (!tx) return "-";
  const detailRef = tx.detail?.reference_id || tx.detail?.request_id;
  if (detailRef && String(detailRef).trim() !== "") {
    return String(detailRef);
  }
  if (tx.reference_id && String(tx.reference_id).trim() !== "") {
    return String(tx.reference_id);
  }
  if (tx.reference_no && String(tx.reference_no).trim() !== "") {
    return String(tx.reference_no);
  }
  if (tx.record_id && String(tx.record_id).trim() !== "") {
    return String(tx.record_id);
  }
  return tx.id ? (String(tx.id).startsWith("#") || String(tx.id).includes("-") ? String(tx.id) : `PjR-${tx.id}`) : "-";
};

export const formatCategoryStr = (cat: string) => {
  if (!cat) return "-";
  return cat.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

export interface CategorizedTransactions {
  poList: Array<{
    date: string;
    ref: string;
    vendor: string;
    description: string;
    amount: number;
    status: string;
  }>;
  billList: Array<{
    date: string;
    billNo: string;
    vendor: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  }>;
  disburseList: Array<{
    date: string;
    voucherNo: string;
    payee: string;
    channel: string;
    amount: number;
    status: string;
  }>;
  ledgerList: Array<{
    date: string;
    ref: string;
    particulars: string;
    category: string;
    debit: number;
    credit: number;
    runningBalance: number;
    status: string;
  }>;
}

export const categorizeTransactions = (
  transactions: any[] = [],
  budgetNum: number = 0,
  todayStr?: string
): CategorizedTransactions => {
  const fallbackToday = todayStr || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const poList: any[] = [];
  const billList: any[] = [];
  const disburseList: any[] = [];
  const ledgerList: any[] = [];

  let runningBalance = budgetNum;

  const rawTxList = Array.isArray(transactions)
    ? transactions
    : Array.isArray((transactions as any)?.results)
    ? (transactions as any).results
    : Array.isArray((transactions as any)?.data)
    ? (transactions as any).data
    : [];

  // Deduplicate incoming transactions by ID or unique reference
  const seenTxKeys = new Set<string>();
  const txList: any[] = [];

  rawTxList.forEach((tx: any) => {
    if (!tx) return;
    const ref = getActualReferenceId(tx);
    const uniqueKey = tx.id ? `id-${tx.id}` : (ref !== "-" ? `ref-${ref}` : `json-${JSON.stringify(tx)}`);
    if (!seenTxKeys.has(uniqueKey)) {
      seenTxKeys.add(uniqueKey);
      txList.push(tx);
    }
  });

  // Mutually exclusive categorization for operational accuracy
  txList.forEach((tx: any) => {
    const rawCat = String(tx.request_type || tx.category || tx.type || tx.project_type || "").toLowerCase().trim();
    const ref = getActualReferenceId(tx);
    const dateStr = tx.created_at || tx.date 
      ? new Date(tx.created_at || tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) 
      : fallbackToday;
    const amt = extractAmount(tx);
    const status = tx.status || "Approved";
    const statusLower = String(status).toLowerCase();

    // 1. Purchase Orders
    if (rawCat === "purchase" || rawCat.includes("purchase") || rawCat.includes("po") || rawCat === "material") {
      const lineDescription = tx.detail?.lines?.[0]?.description || tx.detail?.lines?.[0]?.product_name;
      const vendorText = tx.detail?.vendor_name || tx.detail?.vendor_details?.name || tx.detail?.site_location_details?.location_name || tx.detail?.site_location || "-";
      const descText = tx.detail?.notes || lineDescription || tx.detail?.activity_details?.name || tx.detail?.purpose || "-";
      
      poList.push({
        date: dateStr,
        ref,
        vendor: vendorText,
        description: descText,
        amount: amt,
        status: status,
      });
    }
    // 2. Vendor Bills & Subcontractor Contracts
    else if (rawCat === "subcontractor" || rawCat === "plant_equipment" || rawCat.includes("vendor") || rawCat.includes("bill") || rawCat.includes("contract")) {
      const vendorNameText = tx.detail?.vendor_name || (tx.detail?.equipment_name ? `Equipment: ${tx.detail.equipment_name}` : (tx.detail?.scope_of_work ? `Subcontractor: ${tx.detail.scope_of_work}` : (tx.detail?.vendor ? `Vendor #${tx.detail.vendor}` : "-")));
      const dueDateText = tx.detail?.end_date || tx.detail?.payment_terms || "-";

      billList.push({
        date: dateStr,
        billNo: ref,
        vendor: vendorNameText,
        dueDate: dueDateText,
        totalAmount: amt,
        paidAmount: statusLower.includes("approv") || statusLower === "paid" ? amt : 0,
        status: status,
      });
    }
    // 3. Disbursements & Cash Payments
    else if (rawCat === "petty_cash" || rawCat === "labour" || rawCat === "material_consumption" || rawCat.includes("disburse") || rawCat.includes("cash")) {
      const userFirstName = tx.detail?.requester_details?.user?.first_name;
      const userLastName = tx.detail?.requester_details?.user?.last_name;
      const requester = userFirstName 
        ? `${userFirstName} ${userLastName || ""}`.trim() 
        : (tx.detail?.requester_details?.user?.username || tx.detail?.role_type || tx.detail?.purpose || "-");
      const channel = rawCat === "petty_cash" ? "Petty Cash" : rawCat === "labour" ? "Labour Payment" : formatCategoryStr(rawCat);
      
      disburseList.push({
        date: tx.detail?.date_consumed || tx.detail?.date_required || dateStr,
        voucherNo: ref,
        payee: requester,
        channel,
        amount: amt,
        status: tx.detail?.release_status || status,
      });
    }
    // 4. Fallback categorization based on detail structure
    else {
      if (tx.detail?.vendor_name) {
        billList.push({
          date: dateStr,
          billNo: ref,
          vendor: tx.detail.vendor_name,
          dueDate: "-",
          totalAmount: amt,
          paidAmount: statusLower.includes("approv") ? amt : 0,
          status,
        });
      } else {
        poList.push({
          date: dateStr,
          ref,
          vendor: "-",
          description: tx.detail?.notes || tx.detail?.purpose || `${formatCategoryStr(rawCat)} Request`,
          amount: amt,
          status,
        });
      }
    }

    // 5. Account Ledger (ALL live transactions with running balance)
    const isCredit = rawCat.includes("allocation") || rawCat.includes("topup") || rawCat.includes("credit");
    const debit = !isCredit ? amt : 0;
    const credit = isCredit ? amt : 0;
    runningBalance = runningBalance - debit + credit;

    ledgerList.push({
      date: dateStr,
      ref,
      particulars: tx.detail?.notes || tx.detail?.purpose || tx.detail?.activity_details?.name || (tx.detail?.lines?.[0]?.description ? tx.detail.lines[0].description : `${formatCategoryStr(rawCat)} Transaction`),
      category: formatCategoryStr(rawCat),
      debit,
      credit,
      runningBalance: Math.max(0, runningBalance),
      status,
    });
  });

  return { poList, billList, disburseList, ledgerList };
};

interface ExportTemplateProps {
  project?: ProjectCostingProject;
  transactions?: any[];
  parsedPhases?: any[];
  customColumns?: string[];
  budgetNum?: number;
  actualSpend?: number;
  committedSpend?: number;
  lineChartData?: any[];
  pieChartData?: any[];
  docType?: ExportDocType;
}

export const ProjectCostingExportTemplate = ({
  project,
  transactions = [],
  parsedPhases = [],
  customColumns = [],
  budgetNum = 0,
  actualSpend = 0,
  committedSpend = 0,
  lineChartData = [],
  pieChartData = [],
  docType = "all"
}: ExportTemplateProps) => {
  const today = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  const fin = typeof project?.financials === "string" ? JSON.parse(project.financials) : project?.financials;
  const remaining = fin?.remaining_budget !== undefined && fin?.remaining_budget !== null
    ? Number(fin.remaining_budget)
    : (budgetNum - actualSpend - committedSpend);
  const variance = fin?.consumed_percent !== undefined
    ? Number(fin.consumed_percent)
    : (budgetNum > 0 ? ((actualSpend / budgetNum) * 100) : 0);
  
  const COLORS = ["#3B7CED", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

  const { poList, billList, disburseList, ledgerList } = categorizeTransactions(transactions, budgetNum, today);

  const pmFirstName = (project as any)?.project_manager_details?.first_name?.trim();
  const pmLastName = (project as any)?.project_manager_details?.last_name?.trim();
  const pmCombined = `${pmFirstName || ""} ${pmLastName || ""}`.trim();
  const pmEmail = (project as any)?.project_manager_details?.email;
  const pmNameStr = (pmCombined && pmCombined.toLowerCase() !== "admin")
    ? pmCombined
    : (typeof (project as any)?.project_manager === "string" && (project as any).project_manager.toLowerCase() !== "admin" && (project as any).project_manager.trim()
        ? (project as any).project_manager.trim()
        : (pmEmail && !pmEmail.toLowerCase().startsWith("admin") ? pmEmail : "Unassigned"));

  // Effective Pie Chart Data fallback if not supplied
  let effectivePieData = pieChartData ? pieChartData.filter(item => {
    const lower = (item.name || "").toLowerCase().trim();
    return !lower.includes("material_consumption") && !lower.includes("material consumption");
  }) : [];
  if (!effectivePieData || effectivePieData.length === 0) {
    const catMap = new Map<string, number>();
    let totalCatAmt = 0;
    const rawTxList = Array.isArray(transactions) ? transactions : [];
    rawTxList.forEach((tx: any) => {
      const rawCat = tx.request_type || tx.category || tx.type || "General";
      const lower = String(rawCat).toLowerCase().trim();
      if (lower.includes("material_consumption") || lower.includes("material consumption")) return;
      const cat = formatCategoryStr(rawCat);
      const amt = extractAmount(tx);
      if (amt > 0) {
        catMap.set(cat, (catMap.get(cat) || 0) + amt);
        totalCatAmt += amt;
      }
    });

    if (catMap.size > 0) {
      effectivePieData = Array.from(catMap.entries()).map(([name, amt], idx) => ({
        name,
        amount: amt,
        value: totalCatAmt > 0 ? Math.round((amt / totalCatAmt) * 100) : 0,
        color: COLORS[idx % COLORS.length],
      })).filter(item => item.value > 0);
    }
  }

  // Effective Line Chart Data fallback if not supplied
  let effectiveLineData = lineChartData;
  if (!effectiveLineData || effectiveLineData.length === 0) {
    const chartBudget = budgetNum > 0 ? budgetNum : (actualSpend + committedSpend > 0 ? actualSpend + committedSpend : 0);
    if (chartBudget > 0) {
      const months = ["M1", "M2", "M3", "M4", "M5", "M6"];
      effectiveLineData = months.map((m, idx) => {
        const t = (idx + 1) / months.length;
        const sFactor = (3 * Math.pow(t, 2) - 2 * Math.pow(t, 3));
        return {
          name: m,
          planned: Math.round(chartBudget * sFactor),
          actual: idx <= 2 ? Math.round(actualSpend * ((idx + 1) / 3)) : actualSpend,
          committed: idx <= 3 ? Math.round(committedSpend * ((idx + 1) / 4)) : committedSpend,
        };
      });
    }
  }

  // Document Title by Type
  const getDocumentTitle = () => {
    switch (docType) {
      case "costing":
        return "PROJECT COSTING EXECUTIVE SUMMARY";
      case "po":
        return "PURCHASE ORDERS SCHEDULE";
      case "bills":
        return "VENDOR BILLS & INVOICES REPORT";
      case "disbursements":
        return "DISBURSEMENTS SCHEDULE & AUDIT REPORT";
      case "ledger":
        return "PROJECT ACCOUNT GENERAL LEDGER";
      case "wbs":
        return "WORK BREAKDOWN STRUCTURE (WBS) REPORT";
      default:
        return "COMPLETE PROJECT COSTING & ACCOUNTING MASTER REPORT";
    }
  };

  // Sign-off Block for official downloaded documents
  const renderSignoffBlock = () => (
    <div className="mt-6 pt-5 border-t border-gray-200 grid grid-cols-3 gap-8 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          Prepared By (Project Accountant)
        </span>
        <div className="border-b border-gray-300 w-full mb-1.5"></div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Signature</span>
          <span>Date</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          Verified By (Project Manager)
        </span>
        <div className="border-b border-gray-300 w-full mb-1.5"></div>
        <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
          <span className="truncate max-w-[150px]">{pmNameStr}</span>
          <span className="text-gray-400 text-xs">Date</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          Approved By (Managing Director / CFO)
        </span>
        <div className="border-b border-gray-300 w-full mb-1.5"></div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Signature</span>
          <span>Date</span>
        </div>
      </div>
    </div>
  );

  // Common Master Document Header
  const renderHeader = () => (
    <div className="flex justify-between items-start bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="h-14 w-auto flex-shrink-0 border-r border-gray-200 pr-6">
          <img src="/fastraLogo.png" alt="Fastra Suite Logo" className="h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{project?.name || "-"}</h1>
            {project?.status && (
              <Badge className="bg-green-100 text-green-700 px-3 py-0.5 border-0 font-bold text-xs uppercase">
                {project.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-[#3B7CED]">{(project as any)?.project_code || "-"}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{getDocumentTitle()}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <span className="font-semibold text-gray-500">Client:</span>{" "}
            {(project as any)?.client_name || "N/A"}{" "}
            <span className="mx-2 text-gray-300">|</span>{" "}
            <span className="font-semibold text-gray-500">Project Manager:</span>{" "}
            {pmNameStr}{" "}
            <span className="mx-2 text-gray-300">|</span>{" "}
            <span className="font-semibold text-gray-500">Duration:</span> {(project as any)?.start_date || "-"} to {(project as any)?.expected_end_date || "-"}
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-[10px] font-bold text-[#3B7CED] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
          Official ERP Document
        </span>
        <span className="text-sm font-semibold text-gray-800 mt-1">{today}</span>
        <span className="text-xs text-gray-400">Fastra Suite Project Costing</span>
      </div>
    </div>
  );

  // Section Header for Multi-page sections in Master Report
  const renderSectionHeader = (title: string) => (
    <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-xs mb-2">
      <div className="flex items-center gap-4">
        <img src="/fastraLogo.png" alt="Fastra Logo" className="h-7 w-auto" />
        <div className="h-5 w-px bg-gray-200" />
        <div>
          <h2 className="text-base font-bold text-gray-900">{project?.name || "Project"}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-[#3B7CED]">{(project as any)?.project_code || "PjC"}</span>
            <span>•</span>
            <span className="font-semibold text-gray-700 uppercase tracking-wider">{title}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold text-[#3B7CED] uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded">
          Fastra Suite ERP
        </span>
        <div className="text-xs text-gray-500 mt-0.5">{today}</div>
      </div>
    </div>
  );

  // SECTION 1: PROJECT COSTING SUMMARY (KPIS & CHARTS)
  const renderProjectCostingSection = () => {
    return (
      <div className="flex flex-col gap-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-5 gap-4">
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-center shadow-xs">
            <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">Total Planned Budget</div>
            <div className="text-2xl font-black text-blue-900">{formatCurrency(budgetNum)}</div>
          </div>
          <div className="p-5 rounded-xl border border-orange-100 bg-orange-50/50 flex flex-col justify-center shadow-xs">
            <div className="text-xs text-orange-600 font-bold mb-1 uppercase tracking-wide">Actual Spent</div>
            <div className="text-2xl font-black text-orange-900">{formatCurrency(actualSpend)}</div>
          </div>
          <div className="p-5 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-center shadow-xs">
            <div className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wide">Committed Amount</div>
            <div className="text-2xl font-black text-purple-900">{formatCurrency(committedSpend)}</div>
          </div>
          <div className="p-5 rounded-xl border border-green-100 bg-green-50/50 flex flex-col justify-center shadow-xs">
            <div className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wide">Remaining Budget</div>
            <div className="text-2xl font-black text-green-900">{formatCurrency(remaining)}</div>
          </div>
          <div className="p-5 rounded-xl border border-red-100 bg-red-50/50 flex flex-col justify-center shadow-xs">
            <div className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wide">Variance %</div>
            <div className="text-2xl font-black text-red-900">{variance.toFixed(1)}%</div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-3 gap-6 h-[340px]">
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3B7CED]" />
              Spend Over Time vs Budget Curve
            </h3>
            <div className="w-[830px] h-[250px] flex items-center justify-center">
              {effectiveLineData && effectiveLineData.length > 0 ? (
                <LineChart width={830} height={250} data={effectiveLineData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{fill: '#4B5563', fontSize: 11}} dy={6} />
                  <YAxis axisLine={{ stroke: '#E5E7EB' }} tickLine={false} width={75} tick={{fill: '#4B5563', fontSize: 11}} tickFormatter={(val) => val === 0 ? "₦0" : (val >= 1000000 ? `₦${(val/1000000).toFixed(1)}M` : `₦${(val/1000).toFixed(0)}k`)} />
                  <Legend verticalAlign="top" align="right" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
                  <Line type="monotone" dataKey="planned" name="Planned Spend" stroke="#3B7CED" strokeWidth={2.5} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Spent" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="committed" name="Committed Spent" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} isAnimationActive={false} />
                </LineChart>
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">
                  No spend timeline data recorded for this project
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm relative">
            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3B7CED]" />
              Cost Category Allocation
            </h3>
            <div className="w-[395px] h-[250px] relative flex items-center justify-center">
              {effectivePieData && effectivePieData.length > 0 ? (
                <>
                  <PieChart width={395} height={250}>
                    <Pie
                      data={effectivePieData}
                      cx={197}
                      cy={105}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {effectivePieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 500 }} />
                  </PieChart>
                  <div className="absolute top-[82px] left-0 right-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Spent</span>
                    <span className="text-sm font-black text-gray-800">{formatCurrency(actualSpend).replace(/\.\d+/, '')}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">
                  No category spend data recorded for this project
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SECTION 2: WORK BREAKDOWN STRUCTURE (WBS)
  const renderWbsSection = () => {
    const totalWbsBudget = parsedPhases.reduce((sum, phase) => {
      const phaseTotal = phase.activities?.reduce((actSum: number, act: any) => 
        actSum + Number(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0), 0) || 0;
      return sum + phaseTotal;
    }, 0);
    const totalActivities = parsedPhases.reduce((sum, p) => sum + (p.activities?.length || 0), 0);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col gap-0">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#3B7CED]" />
            <h2 className="text-lg font-bold text-gray-900">Work Breakdown Structure (WBS)</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 bg-gray-200/70 px-2.5 py-1 rounded-md">
              {parsedPhases.length} Phases • {totalActivities} Activities
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Total Budget: {formatCurrency(totalWbsBudget)}
            </span>
          </div>
        </div>

        {docType === "wbs" && (
          <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50/40 border-b border-gray-100">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Phases</span>
              <p className="text-xl font-bold text-gray-800">{parsedPhases.length}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Activities</span>
              <p className="text-xl font-bold text-gray-800">{totalActivities}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total WBS Budget</span>
              <p className="text-xl font-bold text-[#3B7CED]">{formatCurrency(totalWbsBudget)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Custom Attributes</span>
              <p className="text-xl font-bold text-gray-800">{customColumns.length > 0 ? customColumns.join(", ") : "Standard WBS"}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-gray-100/80 border-b border-gray-200">
            <TableRow className="hover:bg-gray-100">
              <TableHead className="w-16 font-bold text-gray-700">S/N</TableHead>
              <TableHead className="font-bold text-gray-700">Phase / Activity Name</TableHead>
              <TableHead className="font-bold text-gray-700 text-center w-20">Qty</TableHead>
              <TableHead className="font-bold text-gray-700 text-right">Unit Rate (NGN)</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Total Budget (NGN)</TableHead>
              {customColumns.map(col => (
                <TableHead key={col} className="font-bold text-gray-700 text-right">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedPhases.map((phase, pIndex) => (
              <React.Fragment key={phase.id || pIndex}>
                {/* Phase Row */}
                <TableRow className="bg-[#EEF2FB] hover:bg-[#EEF2FB] border-b border-white font-bold">
                  <TableCell className="text-[#3B7CED]">{pIndex + 1}</TableCell>
                  <TableCell className="text-[#3B7CED] text-base">{phase.name || `Phase ${pIndex + 1}`}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right text-[#3B7CED]">
                    {formatCurrency(phase.activities?.reduce((sum: number, act: any) => sum + Number(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0), 0) || 0)}
                  </TableCell>
                  {customColumns.map(col => <TableCell key={col}></TableCell>)}
                </TableRow>
                {/* Activity Rows */}
                {phase.activities?.map((act: any, aIndex: number) => (
                  <TableRow key={act.id || aIndex} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="text-gray-400 pl-4">{pIndex + 1}.{act.serial_number || (aIndex + 1)}</TableCell>
                    <TableCell className="pl-8 text-gray-800 font-medium">{act.name}</TableCell>
                    <TableCell className="text-center text-gray-600">{act.quantity || 1}</TableCell>
                    <TableCell className="text-right text-gray-600">{formatCurrency(act.rate || Number(act.amount || 0) / Number(act.quantity || 1))}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">{formatCurrency(act.current_budget || act.amount || (Number(act.quantity || 1) * Number(act.rate || 0)) || 0)}</TableCell>
                    {customColumns.map(col => (
                      <TableCell key={col} className="text-right text-gray-600">
                        {act[col] || act.custom_values?.[col] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            {parsedPhases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5 + customColumns.length} className="text-center py-6 text-gray-500">
                  No Work Breakdown Structure phases available.
                </TableCell>
              </TableRow>
            )}
            {parsedPhases.length > 0 && (
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-800 py-3">
                  TOTAL WBS BUDGET:
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-sm py-3">
                  {formatCurrency(totalWbsBudget)}
                </TableCell>
                {customColumns.map(col => <TableCell key={col}></TableCell>)}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // SECTION 3: PURCHASE ORDERS
  const renderPoSection = () => {
    const totalPoAmount = poList.reduce((sum, po) => sum + Number(po.amount || 0), 0);
    const approvedPoCount = poList.filter(po => po.status.toLowerCase().includes("approv")).length;
    const pendingPoCount = poList.filter(po => po.status.toLowerCase().includes("pend")).length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col gap-0">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#3B7CED]" />
            <h2 className="text-lg font-bold text-gray-900">Purchase Orders</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-1">
              {poList.length} Purchase Orders
            </Badge>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Total Value: {formatCurrency(totalPoAmount)}
            </span>
          </div>
        </div>

        {docType === "po" && (
          <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50/40 border-b border-gray-100">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Purchase Orders</span>
              <p className="text-xl font-bold text-gray-800">{poList.length}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Value</span>
              <p className="text-xl font-bold text-[#3B7CED]">{formatCurrency(totalPoAmount)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Approved Orders</span>
              <p className="text-xl font-bold text-emerald-600">{approvedPoCount}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Pending Review</span>
              <p className="text-xl font-bold text-amber-600">{pendingPoCount}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-gray-100/80 border-b border-gray-200">
            <TableRow className="hover:bg-gray-100">
              <TableHead className="font-bold text-gray-700">Date</TableHead>
              <TableHead className="font-bold text-gray-700">PO Ref ID</TableHead>
              <TableHead className="font-bold text-gray-700">Vendor / Location</TableHead>
              <TableHead className="font-bold text-gray-700">Description</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Amount (NGN)</TableHead>
              <TableHead className="font-bold text-gray-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poList.length > 0 ? poList.map((po, idx) => (
              <TableRow key={idx} className="border-b border-gray-100">
                <TableCell className="text-gray-600 text-xs">{po.date}</TableCell>
                <TableCell className="font-bold text-blue-700 text-xs">{po.ref}</TableCell>
                <TableCell className="text-gray-800 font-medium text-xs">{po.vendor}</TableCell>
                <TableCell className="text-gray-600 text-xs max-w-[280px] truncate">{po.description}</TableCell>
                <TableCell className="text-right font-bold text-gray-900 text-xs">{formatCurrency(po.amount)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                    po.status.toLowerCase().includes("approv")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : po.status.toLowerCase().includes("pend")
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {po.status.toLowerCase().includes("approv") ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    {po.status}
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No Purchase Orders recorded for this project.
                </TableCell>
              </TableRow>
            )}
            {poList.length > 0 && (
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-800 py-3">
                  TOTAL PURCHASE ORDERS:
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-sm py-3">
                  {formatCurrency(totalPoAmount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // SECTION 4: VENDOR BILLS & INVOICES
  const renderBillsSection = () => {
    const totalContractValue = billList.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const totalSettledAmount = billList.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalContractValue - totalSettledAmount);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col gap-0">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#3B7CED]" />
            <h2 className="text-lg font-bold text-gray-900">Vendor Bills & Invoices</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1">
              {billList.length} Vendor Bills
            </Badge>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Contract Value: {formatCurrency(totalContractValue)}
            </span>
          </div>
        </div>

        {docType === "bills" && (
          <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50/40 border-b border-gray-100">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Bills Recorded</span>
              <p className="text-xl font-bold text-gray-800">{billList.length}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Contract Value</span>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalContractValue)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Settled / Paid Amount</span>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalSettledAmount)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Outstanding Balance</span>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-gray-100/80 border-b border-gray-200">
            <TableRow className="hover:bg-gray-100">
              <TableHead className="font-bold text-gray-700">Date</TableHead>
              <TableHead className="font-bold text-gray-700">Vendor Ref ID</TableHead>
              <TableHead className="font-bold text-gray-700">Vendor / Contractor</TableHead>
              <TableHead className="font-bold text-gray-700">Terms / Dates</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Total Contract Value</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Settled Amount</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Outstanding Balance</TableHead>
              <TableHead className="font-bold text-gray-700">Bill Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billList.length > 0 ? billList.map((bill, idx) => (
              <TableRow key={idx} className="border-b border-gray-100">
                <TableCell className="text-gray-600 text-xs">{bill.date}</TableCell>
                <TableCell className="font-bold text-emerald-700 text-xs">{bill.billNo}</TableCell>
                <TableCell className="text-gray-800 font-medium text-xs max-w-[240px] truncate">{bill.vendor}</TableCell>
                <TableCell className="text-gray-600 text-xs">{bill.dueDate}</TableCell>
                <TableCell className="text-right font-bold text-gray-900 text-xs">{formatCurrency(bill.totalAmount)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600 text-xs">{formatCurrency(bill.paidAmount)}</TableCell>
                <TableCell className="text-right font-semibold text-amber-600 text-xs">{formatCurrency(Math.max(0, bill.totalAmount - bill.paidAmount))}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                    String(bill.status).toLowerCase() === "approved" || String(bill.status).toLowerCase() === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {bill.status}
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No Vendor Bills or Invoices recorded for this project.
                </TableCell>
              </TableRow>
            )}
            {billList.length > 0 && (
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-800 py-3">
                  TOTAL CONTRACT VALUE & SETTLED:
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-sm py-3">
                  {formatCurrency(totalContractValue)}
                </TableCell>
                <TableCell className="text-right font-black text-emerald-700 text-sm py-3">
                  {formatCurrency(totalSettledAmount)}
                </TableCell>
                <TableCell className="text-right font-black text-amber-600 text-sm py-3">
                  {formatCurrency(totalOutstanding)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // SECTION 5: DISBURSEMENTS
  const renderDisbursementsSection = () => {
    const totalDisbursed = disburseList.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const releasedCount = disburseList.filter(d => String(d.status).toLowerCase().includes("released") || String(d.status).toLowerCase().includes("approved")).length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col gap-0">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#3B7CED]" />
            <h2 className="text-lg font-bold text-gray-900">Disbursements History</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-100 text-purple-800 font-semibold px-2.5 py-1">
              {disburseList.length} Disbursements
            </Badge>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              Total Disbursed: {formatCurrency(totalDisbursed)}
            </span>
          </div>
        </div>

        {docType === "disbursements" && (
          <div className="grid grid-cols-3 gap-4 p-5 bg-gray-50/40 border-b border-gray-100">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Disbursement Vouchers</span>
              <p className="text-xl font-bold text-gray-800">{disburseList.length}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Disbursed Value</span>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(totalDisbursed)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Released / Settled</span>
              <p className="text-xl font-bold text-emerald-600">{releasedCount}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-gray-100/80 border-b border-gray-200">
            <TableRow className="hover:bg-gray-100">
              <TableHead className="font-bold text-gray-700">Date</TableHead>
              <TableHead className="font-bold text-gray-700">Disbursement Ref ID</TableHead>
              <TableHead className="font-bold text-gray-700">Payee / Recipient</TableHead>
              <TableHead className="font-bold text-gray-700">Channel / Mode</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Disbursed Amount</TableHead>
              <TableHead className="font-bold text-gray-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disburseList.length > 0 ? disburseList.map((disb, idx) => (
              <TableRow key={idx} className="border-b border-gray-100">
                <TableCell className="text-gray-600 text-xs">{disb.date}</TableCell>
                <TableCell className="font-bold text-purple-700 text-xs">{disb.voucherNo}</TableCell>
                <TableCell className="text-gray-800 font-medium text-xs">{disb.payee}</TableCell>
                <TableCell className="text-gray-600 text-xs">{disb.channel}</TableCell>
                <TableCell className="text-right font-bold text-gray-900 text-xs">{formatCurrency(disb.amount)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                    {disb.status}
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No Disbursements recorded for this project.
                </TableCell>
              </TableRow>
            )}
            {disburseList.length > 0 && (
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-800 py-3">
                  TOTAL DISBURSEMENTS:
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-sm py-3">
                  {formatCurrency(totalDisbursed)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // SECTION 6: ACCOUNT LEDGER
  const renderLedgerSection = () => {
    const totalDebit = ledgerList.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = ledgerList.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    const finalBalance = ledgerList.length > 0 ? ledgerList[ledgerList.length - 1].runningBalance : budgetNum;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col gap-0">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3B7CED]" />
            <h2 className="text-lg font-bold text-gray-900">Project Account Ledger</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">
              {ledgerList.length} Financial Records
            </span>
            <span className="text-xs font-bold text-gray-800 bg-gray-200/80 px-2.5 py-1 rounded-md">
              Net Balance: {formatCurrency(finalBalance)}
            </span>
          </div>
        </div>

        {docType === "ledger" && (
          <div className="grid grid-cols-4 gap-4 p-5 bg-gray-50/40 border-b border-gray-100">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Initial Planned Budget</span>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(budgetNum)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Debits (Expenses)</span>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebit)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Credits (Allocations)</span>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCredit)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Current Running Balance</span>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(finalBalance)}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-gray-100/80 border-b border-gray-200">
            <TableRow className="hover:bg-gray-100">
              <TableHead className="font-bold text-gray-700">Date</TableHead>
              <TableHead className="font-bold text-gray-700">Record Ref ID</TableHead>
              <TableHead className="font-bold text-gray-700">Particulars / Activity</TableHead>
              <TableHead className="font-bold text-gray-700">Category</TableHead>
              <TableHead className="text-right font-bold text-red-600">Debit (NGN)</TableHead>
              <TableHead className="text-right font-bold text-emerald-600">Credit (NGN)</TableHead>
              <TableHead className="text-right font-bold text-gray-900">Running Balance</TableHead>
              <TableHead className="font-bold text-gray-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerList.length > 0 ? ledgerList.map((entry, idx) => (
              <TableRow key={idx} className="border-b border-gray-100">
                <TableCell className="text-gray-600 text-xs">{entry.date}</TableCell>
                <TableCell className="font-bold text-gray-900 text-xs">{entry.ref}</TableCell>
                <TableCell className="text-gray-800 font-medium text-xs max-w-[260px] truncate">{entry.particulars}</TableCell>
                <TableCell className="text-gray-600 text-xs">{entry.category}</TableCell>
                <TableCell className="text-right font-bold text-red-600 text-xs">
                  {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600 text-xs">
                  {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-xs">
                  {formatCurrency(entry.runningBalance)}
                </TableCell>
                <TableCell className="text-gray-600 text-xs capitalize">{entry.status}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No General Ledger entries recorded.
                </TableCell>
              </TableRow>
            )}
            {ledgerList.length > 0 && (
              <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-800 py-3">
                  TOTAL DEBIT / CREDIT:
                </TableCell>
                <TableCell className="text-right font-black text-red-600 text-sm py-3">
                  {formatCurrency(totalDebit)}
                </TableCell>
                <TableCell className="text-right font-black text-emerald-600 text-sm py-3">
                  {formatCurrency(totalCredit)}
                </TableCell>
                <TableCell className="text-right font-black text-gray-900 text-sm py-3">
                  {formatCurrency(finalBalance)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10 bg-gray-50 font-sans text-gray-800 relative">
      {/* SECTION SELECTION BY DOC TYPE */}
      {docType === "all" ? (
        <>
          {/* Section 1: Executive Summary & Charts */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderHeader()}
            {renderProjectCostingSection()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Project Costing Executive Summary</div>
              <div>Page 1 • Official Costing Document</div>
            </div>
          </div>

          {/* Section 2: Work Breakdown Structure */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderSectionHeader("Work Breakdown Structure (WBS)")}
            {renderWbsSection()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Work Breakdown Structure</div>
              <div>Page 2 • Official Costing Document</div>
            </div>
          </div>

          {/* Section 3: Purchase Orders */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderSectionHeader("Purchase Orders Schedule")}
            {renderPoSection()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Purchase Orders Schedule</div>
              <div>Page 3 • Official Costing Document</div>
            </div>
          </div>

          {/* Section 4: Vendor Bills */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderSectionHeader("Vendor Bills & Invoices")}
            {renderBillsSection()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Vendor Bills & Invoices</div>
              <div>Page 4 • Official Costing Document</div>
            </div>
          </div>

          {/* Section 5: Disbursements */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderSectionHeader("Disbursements Schedule & Audit")}
            {renderDisbursementsSection()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Disbursements Schedule</div>
              <div>Page 5 • Official Costing Document</div>
            </div>
          </div>

          {/* Section 6: Account Ledger & Sign-off */}
          <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-6 relative overflow-hidden">
            {renderSectionHeader("Project Account General Ledger")}
            {renderLedgerSection()}
            {renderSignoffBlock()}
            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <div>Fastra Suite ERP - Project Account General Ledger</div>
              <div>Page 6 • Confidential Audit Trail</div>
            </div>
          </div>
        </>
      ) : (
        /* Single Document Export */
        <div data-export-section="true" className="w-[1400px] bg-gray-50 p-8 flex flex-col gap-8 relative overflow-hidden">
          {renderHeader()}
          {docType === "costing" && renderProjectCostingSection()}
          {docType === "wbs" && renderWbsSection()}
          {docType === "po" && renderPoSection()}
          {docType === "bills" && renderBillsSection()}
          {docType === "disbursements" && renderDisbursementsSection()}
          {docType === "ledger" && renderLedgerSection()}
          {renderSignoffBlock()}
          <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
            <div>Generated via Fastra Suite ERP System - Project Costing Module</div>
            <div>Official Costing Document • Confidential</div>
          </div>
        </div>
      )}
    </div>
  );
};
