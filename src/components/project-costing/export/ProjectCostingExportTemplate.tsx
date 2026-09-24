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
  ResponsiveContainer,
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

const formatCurrency = (amount: number | string) => {
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
  return tx.id ? `#${tx.id}` : "-";
};

export const formatCategoryStr = (cat: string) => {
  if (!cat) return "-";
  return cat.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
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
  pieChartData = []
}: ExportTemplateProps) => {
  const today = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  const fin = typeof project?.financials === "string" ? JSON.parse(project.financials) : project?.financials;
  const remaining = fin?.remaining_budget !== undefined && fin?.remaining_budget !== null
    ? Number(fin.remaining_budget)
    : (budgetNum - actualSpend - committedSpend);
  const variance = fin?.consumed_percent !== undefined
    ? Number(fin.consumed_percent)
    : (budgetNum > 0 ? ((actualSpend / budgetNum) * 100) : 0);
  
  const COLORS = ["#3B7CED", "#2BA24D", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  // Categorize ACTUAL live transactions strictly from API fields without any dummy text
  const categorizeTransactions = () => {
    const poList: any[] = [];
    const billList: any[] = [];
    const disburseList: any[] = [];
    const ledgerList: any[] = [];

    let runningBalance = budgetNum;

    const txList = Array.isArray(transactions)
      ? transactions
      : Array.isArray((transactions as any)?.results)
      ? (transactions as any).results
      : Array.isArray((transactions as any)?.data)
      ? (transactions as any).data
      : [];

    txList.forEach((tx: any) => {
      const cat = String(tx.request_type || tx.category || tx.type || "").toLowerCase();
      const ref = getActualReferenceId(tx);
      const dateStr = tx.created_at || tx.date 
        ? new Date(tx.created_at || tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) 
        : today;
      const amt = extractAmount(tx);
      const status = tx.status || "Approved";
      const statusLower = String(status).toLowerCase();

      // 1. Purchase Orders & Check Requests
      if (cat === "purchase" || cat.includes("purchase") || cat.includes("po")) {
        const lineDescription = tx.detail?.lines?.[0]?.description || tx.detail?.lines?.[0]?.product_name;
        const vendorText = tx.detail?.vendor_name || tx.detail?.vendor_details?.name || tx.detail?.site_location_details?.location_name || tx.detail?.site_location || "-";
        const descText = tx.detail?.notes || lineDescription || tx.detail?.activity_details?.name || tx.detail?.purpose || "-";
        
        poList.push({
          date: dateStr,
          ref,
          vendor: vendorText,
          description: descText,
          amount: amt,
          poStatus: status,
          checkRequestStatus: statusLower.includes("approv") ? "Available for Check Request" : statusLower.includes("pend") ? "Pending Review" : status,
        });
      }

      // 2. Vendor Bills
      if (cat === "subcontractor" || cat === "plant_equipment" || cat.includes("vendor") || cat.includes("bill") || cat.includes("contract")) {
        const vendorNameText = tx.detail?.vendor_name || (tx.detail?.equipment_name ? `Equipment: ${tx.detail.equipment_name}` : (tx.detail?.scope_of_work ? `Subcontractor: ${tx.detail.scope_of_work}` : (tx.detail?.vendor ? `Vendor #${tx.detail.vendor}` : "-")));
        const dueDateText = tx.detail?.end_date || tx.detail?.payment_terms || "-";

        billList.push({
          date: dateStr,
          billNo: ref,
          vendor: vendorNameText,
          dueDate: dueDateText,
          totalAmount: amt,
          paidAmount: statusLower.includes("approv") ? amt : 0,
          status: status,
        });
      }

      // 3. Disbursements
      if (cat === "petty_cash" || cat === "labour" || cat === "material_consumption" || cat.includes("disburse") || cat.includes("cash") || cat.includes("pay")) {
        const userFirstName = tx.detail?.requester_details?.user?.first_name;
        const userLastName = tx.detail?.requester_details?.user?.last_name;
        const requester = userFirstName 
          ? `${userFirstName} ${userLastName || ""}`.trim() 
          : (tx.detail?.requester_details?.user?.username || tx.detail?.role_type || tx.detail?.purpose || "-");
        const channel = cat === "petty_cash" ? "Petty Cash" : cat === "labour" ? "Labour Payment" : formatCategoryStr(cat);
        
        disburseList.push({
          date: tx.detail?.date_consumed || tx.detail?.date_required || dateStr,
          voucherNo: ref,
          payee: requester,
          channel,
          amount: amt,
          status: tx.detail?.release_status || status,
        });
      }

      // 4. Ledger Entries (ALL live transactions)
      const isCredit = cat.includes("allocation") || cat.includes("topup");
      const debit = !isCredit ? amt : 0;
      const credit = isCredit ? amt : 0;
      runningBalance = runningBalance - debit + credit;

      ledgerList.push({
        date: dateStr,
        ref,
        particulars: tx.detail?.notes || tx.detail?.purpose || tx.detail?.activity_details?.name || (tx.detail?.lines?.[0]?.description ? tx.detail.lines[0].description : `${formatCategoryStr(cat)} Transaction`),
        category: formatCategoryStr(cat),
        debit,
        credit,
        runningBalance: Math.max(0, runningBalance),
        status,
      });
    });

    return { poList, billList, disburseList, ledgerList };
  };

  const { poList, billList, disburseList, ledgerList } = categorizeTransactions();

  const pmFirstName = (project as any)?.project_manager_details?.first_name;
  const pmLastName = (project as any)?.project_manager_details?.last_name;
  const pmEmail = (project as any)?.project_manager_details?.email;
  const pmNameStr = pmFirstName || pmLastName
    ? `${pmFirstName || ""} ${pmLastName || ""}`.trim()
    : (pmEmail || "-");

  return (
    <div className="w-[1400px] bg-gray-50 p-8 font-sans text-gray-800 flex flex-col gap-8 relative overflow-hidden">
      
      {/* BACKGROUND WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.02]">
        <img src="/fastraLogo.png" alt="Fastra Watermark" className="w-[900px] h-auto object-contain grayscale" />
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* DOCUMENT SECTION 1: PROJECT COSTING HEADER & SUMMARY */}
        <div className="flex justify-between items-start bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-14 w-auto flex-shrink-0 border-r border-gray-200 pr-6">
              <img src="/fastraLogo.png" alt="Fastra Suite Logo" className="h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900">{project?.name || "-"}</h1>
                <Badge className="bg-green-100 text-green-700 px-3 py-0.5 border-0 font-medium text-xs uppercase">
                  {project?.status || "-"}
                </Badge>
              </div>
              <div className="text-xs font-semibold text-[#3B7CED] mt-1">{(project as any)?.project_code || "-"}</div>
              <div className="text-xs text-gray-700 mt-1">
                <span className="font-semibold text-gray-500">Project Manager:</span>{" "}
                {pmNameStr}{" "}
                <span className="mx-2">|</span>{" "}
                <span className="font-semibold text-gray-500">Duration:</span> {(project as any)?.start_date || "-"} to {(project as any)?.expected_end_date || "-"}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Official Document</span>
            <span className="text-sm font-semibold text-gray-800">{today}</span>
            <span className="text-xs text-gray-400 mt-1">Fastra Suite Project Accounting</span>
          </div>
        </div>

        {/* KPI CARDS SECTION */}
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
        <div className="grid grid-cols-3 gap-6 h-[360px]">
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3B7CED]" />
              Spend Over Time vs Budget Curve
            </h3>
            <div className="flex-1 w-full min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => val === 0 ? "₦0" : `₦${(val/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="planned" name="Planned Spend" stroke="#3B7CED" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" name="Actual Spent" stroke="#2BA24D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="committed" name="Committed Spent" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm relative">
            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3B7CED]" />
              Cost Category Allocation
            </h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData.length > 0 ? pieChartData : [{ name: "No Category Data", value: 1 }]}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {(pieChartData.length > 0 ? pieChartData : [{ name: "No Category Data", value: 1 }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Total Spent</span>
                <span className="text-base font-black text-gray-800">{formatCurrency(actualSpend).replace(/\.\d+/, '')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENT SECTION 2: WORK BREAKDOWN STRUCTURE (WBS) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3B7CED]" />
              <h2 className="text-lg font-bold text-gray-900">Work Breakdown Structure (WBS)</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-200/70 px-2.5 py-1 rounded-md">
              {parsedPhases.length} Phases Configured
            </span>
          </div>
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
            </TableBody>
          </Table>
        </div>

        {/* DOCUMENT SECTION 3: PURCHASE ORDERS & CHECK REQUESTS (WITH STATUS) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#3B7CED]" />
              <h2 className="text-lg font-bold text-gray-900">Purchase Orders & Check Requests</h2>
            </div>
            <Badge className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-1">
              {poList.length} Purchase Requests
            </Badge>
          </div>
          <Table>
            <TableHeader className="bg-gray-100/80 border-b border-gray-200">
              <TableRow className="hover:bg-gray-100">
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Request Ref ID</TableHead>
                <TableHead className="font-bold text-gray-700">Vendor / Location</TableHead>
                <TableHead className="font-bold text-gray-700">Description</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Amount (NGN)</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="font-bold text-gray-700">Check Request Status</TableHead>
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
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      <CheckCircle2 className="w-3 h-3" />
                      {po.poStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      {po.checkRequestStatus}
                    </span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No Purchase Orders or Check Requests recorded for this project.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* DOCUMENT SECTION 4: VENDOR BILLS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#3B7CED]" />
              <h2 className="text-lg font-bold text-gray-900">Vendor Bills & Invoices</h2>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1">
              {billList.length} Vendor Bills
            </Badge>
          </div>
          <Table>
            <TableHeader className="bg-gray-100/80 border-b border-gray-200">
              <TableRow className="hover:bg-gray-100">
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Vendor Ref ID</TableHead>
                <TableHead className="font-bold text-gray-700">Vendor / Contractor</TableHead>
                <TableHead className="font-bold text-gray-700">Terms / Dates</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Total Contract Value</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Settled Amount</TableHead>
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
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                      String(bill.status).toLowerCase() === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {bill.status}
                    </span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No Vendor Bills or Invoices recorded for this project.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* DOCUMENT SECTION 5: DISBURSEMENTS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#3B7CED]" />
              <h2 className="text-lg font-bold text-gray-900">Disbursements History</h2>
            </div>
            <Badge className="bg-purple-100 text-purple-800 font-semibold px-2.5 py-1">
              {disburseList.length} Disbursements
            </Badge>
          </div>
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
            </TableBody>
          </Table>
        </div>

        {/* DOCUMENT SECTION 6: ACCOUNT LEDGER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#3B7CED]" />
              <h2 className="text-lg font-bold text-gray-900">Project Account Ledger</h2>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {ledgerList.length} Financial Transaction Records
            </span>
          </div>
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
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No General Ledger entries recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          <div>Generated via Fastra Suite ERP System - Project Costing Module</div>
          <div>Official Costing Report</div>
        </div>

      </div>
    </div>
  );
};
