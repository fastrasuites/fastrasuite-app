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
import { ProjectCostingProject } from "@/types/projectCosting";

const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(amount));
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

  return (
    <div className="w-[1400px] bg-gray-50 p-8 font-sans text-gray-800 flex flex-col gap-6 relative overflow-hidden">
      
      {/* BACKGROUND WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
        <img src="/fastraLogo.png" alt="Fastra Watermark" className="w-[800px] h-auto object-contain grayscale" />
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* 1. HEADER SECTION (Matches Fastra Suite UI) */}
        <div className="flex justify-between items-start bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-12 w-auto flex-shrink-0 border-r border-gray-200 pr-6">
              <img src="/fastraLogo.png" alt="Fastra Suite Logo" className="h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{project?.name || "Project"}</h2>
                <Badge className="bg-green-100 text-green-700 px-3 py-0.5 border-0 font-medium text-xs">
                  {project?.status || "ACTIVE"}
                </Badge>
              </div>
              <div className="text-sm text-gray-500 mt-2">{(project as any)?.project_code || "PRJ-CODE"}</div>
              <div className="text-sm text-gray-800 mt-1">
                <span className="font-semibold text-gray-600">Project Manager:</span>{" "}
                {(project as any)?.project_manager_details?.first_name || (project as any)?.project_manager_details?.last_name
                  ? `${(project as any).project_manager_details.first_name || ""} ${(project as any).project_manager_details.last_name || ""}`.trim()
                  : (project as any)?.project_manager_details?.email || (typeof (project as any)?.project_manager === "string" ? (project as any).project_manager : "N/A")}{" "}
                <span className="mx-2"> </span>{" "}
                <span className="font-semibold text-gray-600">Date:</span> {(project as any)?.start_date || "Start Date"} - {(project as any)?.expected_end_date || "End Date"}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Generated</span>
            <span className="text-sm font-medium text-gray-800">{today}</span>
          </div>
        </div>

        {/* 2. KPI CARDS SECTION (Unified Block with Colors) */}
        <div className="grid grid-cols-5 gap-4">
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-center">
            <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">Total Planned Budget</div>
            <div className="text-2xl font-black text-blue-900">{formatCurrency(budgetNum)}</div>
          </div>
          <div className="p-5 rounded-xl border border-orange-100 bg-orange-50/50 flex flex-col justify-center">
            <div className="text-xs text-orange-600 font-bold mb-1 uppercase tracking-wide">Actual Spent</div>
            <div className="text-2xl font-black text-orange-900">{formatCurrency(actualSpend)}</div>
          </div>
          <div className="p-5 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-center">
            <div className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wide">Committed Amount</div>
            <div className="text-2xl font-black text-purple-900">{formatCurrency(committedSpend)}</div>
          </div>
          <div className="p-5 rounded-xl border border-green-100 bg-green-50/50 flex flex-col justify-center">
            <div className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wide">Remaining</div>
            <div className="text-2xl font-black text-green-900">{formatCurrency(remaining)}</div>
          </div>
          <div className="p-5 rounded-xl border border-red-100 bg-red-50/50 flex flex-col justify-center">
            <div className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wide">Variance</div>
            <div className="text-2xl font-black text-red-900">{variance.toFixed(1)}%</div>
          </div>
        </div>

        {/* 3. CHARTS SECTION */}
        <div className="grid grid-cols-3 gap-6 h-[400px]">
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6 flex flex-col shadow-sm">
            <h3 className="text-lg font-medium text-[#3B7CED] mb-6">Spend Over Time vs Budget Curve</h3>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => val === 0 ? "₦0" : `₦${(val/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="planned" name="Planned Spend" stroke="#3B7CED" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" name="Actual Spent" stroke="#2BA24D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col shadow-sm relative">
            <h3 className="text-lg font-medium text-[#3B7CED] mb-2">Cost Category Breakdown</h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieChartData.length > 0 ? pieChartData : [{ name: "No Data", value: 1 }]}
                    cx="50%"
                    cy="45%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    label={({
                      cx,
                      cy,
                      midAngle = 0,
                      innerRadius,
                      outerRadius,
                      percent = 0,
                      index
                    }: any) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      if (pieChartData.length === 0) return null;
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {(pieChartData.length > 0 ? pieChartData : [{ name: "No Data", value: 1 }]).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)} 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner Pie Chart Label (Donut Hole text) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total</span>
                <span className="text-lg font-black text-gray-800">{formatCurrency(actualSpend).replace(/\.\d+/, '')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. WBS BREAKDOWN SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-medium text-[#3B7CED]">Work Breakdown Structure (WBS)</h3>
          </div>
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="hover:bg-gray-50">
                <TableHead className="w-16 font-bold text-gray-700">S/N</TableHead>
                <TableHead className="font-bold text-gray-700">Phase / Activity</TableHead>
                <TableHead className="font-bold text-gray-700 text-center w-16">Qty</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Rate</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Budget</TableHead>
                {customColumns.map(col => (
                  <TableHead key={col} className="font-bold text-gray-700 text-right">{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedPhases.map((phase, pIndex) => (
                <React.Fragment key={phase.id || pIndex}>
                  {/* Phase Row */}
                  <TableRow className="bg-[#EEF2FB] hover:bg-[#EEF2FB] border-b border-white">
                    <TableCell className="font-bold text-gray-800"></TableCell>
                    <TableCell className="font-bold text-gray-800">{phase.name || `Phase ${pIndex + 1}`}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-bold text-gray-800">
                      {formatCurrency(phase.activities?.reduce((sum: number, act: any) => sum + Number(act.amount || 0), 0) || 0)}
                    </TableCell>
                    {customColumns.map(col => <TableCell key={col}></TableCell>)}
                  </TableRow>
                  {/* Activity Rows */}
                  {phase.activities?.map((act: any, aIndex: number) => (
                    <TableRow key={act.id || aIndex} className="border-b border-gray-100">
                      <TableCell className="text-gray-500 pl-4">{pIndex + 1}.{aIndex + 1}</TableCell>
                      <TableCell className="pl-10 text-gray-600">{act.name}</TableCell>
                      <TableCell className="text-center text-gray-600">{act.quantity || 1}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatCurrency(act.rate || Number(act.amount || 0) / Number(act.quantity || 1))}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatCurrency(act.amount || 0)}</TableCell>
                      {customColumns.map(col => (
                        <TableCell key={col} className="text-right text-gray-600">
                          {act[col] || act.custom_values?.[col] || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              {parsedPhases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5 + customColumns.length} className="text-center py-6 text-gray-500">
                    No phases data available for this project.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. RECENT TRANSACTIONS SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-medium text-[#3B7CED]">Recent Transactions & Adjustments</h3>
          </div>
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="hover:bg-gray-50">
                <TableHead className="font-bold text-gray-700">Date</TableHead>
                <TableHead className="font-bold text-gray-700">Reference</TableHead>
                <TableHead className="font-bold text-gray-700">Category</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Amount</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? transactions.slice(0, 10).map((trx: any, idx: number) => (
                <TableRow key={idx} className="border-b border-gray-100">
                  <TableCell className="text-gray-600">{new Date(trx.created_at || trx.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-gray-800">{trx.reference_id || trx.ref || `TRX-${idx}`}</TableCell>
                  <TableCell className="text-gray-600">{trx.category || trx.type || trx.request_type || "-"}</TableCell>
                  <TableCell className="text-right font-bold text-gray-800">{formatCurrency(trx.amount || trx.total_amount || trx.detail?.total_amount || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={(trx.status || "Completed") === "Completed" ? "validated" : "pending"} className="shadow-none border-0 px-2 py-0.5 font-normal">
                      {trx.status || "Completed"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    No recent transactions recorded for this project yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
};
