import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  FileText,
  Clipboard,
  ClipboardPenLine,
  LayoutGrid,
  Warehouse,
  Bell,
  HelpCircle,
  Calendar,
  Zap,
  Settings,
  ArrowRightFromLine,
} from "lucide-react";

import fastraLogo from "../../../public/fastraLogo.png";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen border">
      {/* Left Column: Brand Hero + 100% Authentic Project Costing App Preview */}
      <div
        className="flex-1 overflow-hidden relative bg-[#F8F9FB]"
        aria-hidden="true"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden fixed flex items-center gap-3 w-25 h-10 m-4 z-50">
          <Image
            src={fastraLogo}
            alt="Fastra"
            width={1000}
            height={1000}
            className="object-fill w-full h-auto"
          />
        </div>

        <div className="min-h-screen relative hidden lg:flex flex-col p-6 md:p-8 lg:pl-12 lg:pr-0">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-3 w-28 h-8 mb-1.5">
            <Image
              src={fastraLogo}
              alt="Fastra"
              width={1000}
              height={1000}
              className="object-fill w-full h-auto"
            />
          </div>

          {/* Hero Heading - Open Sans & Spaced */}
          <div className={`hidden lg:block mb-6 max-w-lg space-y-2 ${openSans.className}`}>
            <h1 className="text-xl leading-tight font-bold text-gray-900 tracking-tight">
              Maximize the Planning of Projects with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B7CED] to-[#2143a9]">
                Fastra Suite
              </span>
            </h1>

            <p className="text-xs text-gray-600 max-w-md font-normal leading-relaxed">
              Scale Without Limits: Automate, Integrate, and Secure Your Project Operations & Budget Costing.
            </p>

            <div className="pt-1">
              <Button
                variant="default"
                className="cursor-pointer transition-shadow text-xs h-6.5 px-3 bg-[#3B7CED] hover:bg-[#3065c3] text-white font-semibold rounded-md shadow-xs"
              >
                <span>Contact Us</span>
              </Button>
            </div>
          </div>

          {/* Project Costing Preview Mockup - Straight, Level, 100% Authentic, With Sliding Prices Visible */}
          <div className="hidden lg:flex relative flex-1 mt-2">
            {/* The Application Window: Vector-Crisp, Scaled 80% */}
            <div className="absolute left-0 top-0 w-[1240px] bg-white rounded-tl-xl shadow-[0_20px_50px_rgba(0,0,0,0.10)] border border-gray-200/90 overflow-hidden flex flex-row select-none origin-top-left scale-[0.80]">
              
              {/* Subtle Ambient Shimmer Overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"
                style={{ animation: "shimmerBeam 7s ease-in-out infinite" }}
              />
              
              {/* 1. Fastra Suite Actual Sidebar (Matching live app collapsed sidebar layout 100%) */}
              <div className="w-13 bg-white border-r border-gray-100 flex flex-col justify-between items-center py-4 shrink-0 text-gray-400">
                {/* Main Navigation Icons (No logo at top, exactly like actual app) */}
                <div className="flex flex-col gap-3 items-center w-full">
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <LayoutGrid size={18} />
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <FileText size={18} />
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <Warehouse size={18} />
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <ClipboardPenLine size={18} />
                  </div>
                  {/* Active Project Costing menu item */}
                  <div className="p-1.5 text-[#2563EB] bg-blue-50/80 rounded-lg relative cursor-pointer">
                    <Clipboard size={18} />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#2563EB] rounded-r" />
                  </div>
                </div>

                {/* Bottom Utility Icons (Upgrade Plan, Settings, Collapse Toggle) */}
                <div className="flex flex-col gap-3 items-center w-full pt-4 border-t border-gray-100/60">
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer" title="Upgrade plan">
                    <Zap size={18} />
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer" title="Settings">
                    <Settings size={18} />
                  </div>
                  <div className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer" title="Sidebar toggle">
                    <ArrowRightFromLine size={18} />
                  </div>
                </div>
              </div>

              {/* 2. Main In-App Content (100% Matching live Project Costing Details Page) */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
                
                {/* Authentic Fastra Suite TopBar Header */}
                <header className="h-10 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0 w-full pr-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md hover:bg-gray-100 text-gray-600 flex items-center justify-center">
                      <ArrowLeft size={15} />
                    </div>
                    <h1 className="text-[14px] font-bold text-gray-900 tracking-tight">
                      Project Costing
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Notification Bell with Red Badge 72 */}
                    <div className="relative cursor-pointer text-gray-600 hover:text-gray-800">
                      <Bell size={15} />
                      <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 bg-[#EF4444] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        72
                      </span>
                    </div>

                    {/* User Profile Avatar BA */}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-gray-100">
                      <div className="w-5.5 h-5.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[9px] flex items-center justify-center border border-blue-200">
                        BA
                      </div>
                      <span className="text-[10px] font-medium text-gray-700">babatunde_adeleke</span>
                      <ChevronDown size={11} className="text-gray-400" />
                    </div>
                  </div>
                </header>

                {/* Project Details Workspace */}
                <div className="flex-1 p-3 space-y-2">
                  
                  {/* Top Navigation Row: Breadcrumb */}
                  <div className="flex items-center text-[10px] text-gray-500 font-medium w-full pr-4">
                    <ArrowLeft className="h-3 w-3 mr-1 text-gray-400" />
                    <span>Eko Atlantic Horizon Tower & Financial Plaza – Phase I</span>
                  </div>

                  {/* Project Header Info */}
                  <div className="flex justify-between items-start gap-2 w-full pr-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-bold text-gray-900 tracking-tight">
                          Eko Atlantic Horizon Tower
                        </h2>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Active
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">PC-2026-088</div>
                      <div className="text-[8.5px] text-gray-600 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        <span className="whitespace-nowrap"><strong className="text-gray-700 font-semibold">PM:</strong> Engr. Babatunde Adeleke, FNSE</span>
                        <span className="text-gray-300">|</span>
                        <span className="whitespace-nowrap"><strong className="text-gray-700 font-semibold">Date:</strong> 2026-10-15 – 2028-11-28</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="border border-[#3B7CED] text-[#3B7CED] bg-white hover:bg-blue-50 h-6 font-medium flex items-center gap-1 px-2 rounded text-[9.5px] shadow-2xs whitespace-nowrap"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>Export Report</span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                      </button>
                      <button
                        type="button"
                        className="border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 h-6 font-medium flex items-center gap-1 px-1.5 rounded text-[9.5px] shadow-2xs whitespace-nowrap"
                      >
                        <HelpCircle className="w-2.5 h-2.5 text-blue-500" />
                        <span>Guide</span>
                      </button>
                    </div>
                  </div>

                  {/* Filters & Actions Bar */}
                  <div className="flex items-end justify-between py-1 border-b border-gray-200 pb-1.5 w-full pr-4">
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-semibold text-gray-700">Date Range</label>
                        <div className="flex gap-1">
                          <div className="w-20 h-5.5 bg-white border border-gray-200 rounded px-1 flex items-center justify-between text-[8.5px] text-gray-600 font-mono shadow-2xs">
                            <span>10/15/2026</span>
                            <Calendar size={8} className="text-gray-400" />
                          </div>
                          <div className="w-20 h-5.5 bg-white border border-gray-200 rounded px-1 flex items-center justify-between text-[8.5px] text-gray-600 font-mono shadow-2xs">
                            <span>11/28/2028</span>
                            <Calendar size={8} className="text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-semibold text-gray-700">Cost Category</label>
                        <div className="w-25 h-5.5 bg-white border border-gray-200 rounded px-1.5 flex items-center justify-between text-[8.5px] text-gray-700 shadow-2xs font-medium">
                          <span>All Categories</span>
                          <ChevronDown size={9} className="text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="border border-[#3B7CED] text-[#3B7CED] bg-white hover:bg-blue-50 h-5.5 font-medium px-2 rounded text-[8.5px] shadow-2xs whitespace-nowrap"
                    >
                      Create Budget Adjustment
                    </button>
                  </div>

                  {/* 5-Item KPI Cards Strip with Staggered On-Load Entrance */}
                  <div className="grid grid-cols-5 bg-white rounded-lg shadow-2xs border border-gray-100 divide-x divide-gray-100 w-full pr-0">
                    <div className="py-1 px-1.5 animate-stagger-1">
                      <div className="text-[7.5px] text-gray-500 font-medium">Budget</div>
                      <div className="text-[10px] font-bold text-gray-800 truncate">₦2,450,000,000</div>
                    </div>
                    <div className="py-1 px-1.5 animate-stagger-2">
                      <div className="text-[7.5px] text-gray-500 font-medium">Actual Spent</div>
                      <div className="text-[10px] font-bold text-gray-800 truncate">₦982,450,000</div>
                    </div>
                    <div className="py-1 px-1.5 animate-stagger-3">
                      <div className="text-[7.5px] text-gray-500 font-medium">Committed</div>
                      <div className="text-[10px] font-bold text-gray-800 truncate">₦614,800,000</div>
                    </div>
                    <div className="py-1 px-1.5 animate-stagger-4">
                      <div className="text-[7.5px] text-gray-500 font-medium">Remaining</div>
                      <div className="text-[10px] font-bold text-gray-800 truncate">₦852,750,000</div>
                    </div>
                    <div className="py-1 px-1.5 animate-stagger-5">
                      <div className="text-[7.5px] text-gray-500 font-medium">Variance</div>
                      <div className="text-[10px] font-bold text-emerald-600 truncate">+₦48,200,000</div>
                    </div>
                  </div>

                  {/* Diverse & Rich Multi-Chart System: Dynamic S-Curve + Budget Utilization + Donut Chart */}
                  <div className="grid grid-cols-5 gap-2 pr-4">
                    
                    {/* Left 3 cols: Dynamic Spend Over Time vs Budget S-Curve */}
                    <div className="col-span-3 bg-white p-2 rounded-lg shadow-2xs border border-gray-100 flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[9.5px] font-bold text-[#3B7CED]">
                          Spend Over Time vs Budget Curve
                        </h3>

                        {/* Interactive Series Toggle Pills */}
                        <div className="flex gap-0.5 items-center">
                          <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[6.5px] font-semibold border bg-[#EBF7EE] border-[#2BA24D]/40 text-[#1E8E3E]">
                            <span className="w-1 h-1 rounded-full bg-[#2BA24D]" />
                            <span>Actual</span>
                            <span className="w-2 h-2 rounded-full bg-[#2BA24D] text-white flex items-center justify-center text-[5px]">✓</span>
                          </div>
                          <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[6.5px] font-semibold border bg-[#FEF7EC] border-[#F59E0B]/40 text-[#B45309]">
                            <span className="w-1 h-1 rounded-full bg-[#F59E0B]" />
                            <span>Committed</span>
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[5px]">✓</span>
                          </div>
                          <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[6.5px] font-semibold border bg-[#EFF6FF] border-[#3B7CED]/40 text-[#1D4ED8]">
                            <span className="w-1 h-1 rounded-full bg-[#3B7CED]" />
                            <span>Planned</span>
                            <span className="w-2 h-2 rounded-full bg-[#3B7CED] text-white flex items-center justify-center text-[5px]">✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Vector Multi-Curve S-Curve Chart — generous height */}
                      <div className="w-full flex-1" style={{ height: "130px" }}>
                        <svg viewBox="0 0 320 110" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="richCommittedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="richActualGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          <line x1="28" y1="10" x2="315" y2="10" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="28" y1="30" x2="315" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="28" y1="50" x2="315" y2="50" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="28" y1="70" x2="315" y2="70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="28" y1="90" x2="315" y2="90" stroke="#E2E8F0" strokeWidth="1" />

                          {/* Y-Axis Financial Labels */}
                          <text x="24" y="13" textAnchor="end" fontSize="6" fill="#94A3B8" fontWeight="600">₦2.5B</text>
                          <text x="24" y="33" textAnchor="end" fontSize="6" fill="#94A3B8">₦1.8B</text>
                          <text x="24" y="53" textAnchor="end" fontSize="6" fill="#94A3B8">₦1.2B</text>
                          <text x="24" y="73" textAnchor="end" fontSize="6" fill="#94A3B8">₦500M</text>
                          <text x="24" y="91" textAnchor="end" fontSize="6" fill="#94A3B8">₦0</text>

                          {/* Planned Spend: Realistic S-Curve (dashed blue) with animated dashFlow */}
                          <path
                            d="M 28 90 C 90 88, 145 60, 200 35 C 255 14, 285 11, 315 10"
                            fill="none"
                            stroke="#3B7CED"
                            strokeWidth="1.4"
                            strokeDasharray="4 3"
                            style={{ animation: "dashFlow 4s linear infinite" }}
                          />

                          {/* Committed Spend Area + Line */}
                          <path
                            d="M 28 90 L 65 82 L 105 68 L 150 52 L 190 36 L 190 90 Z"
                            fill="url(#richCommittedGrad)"
                            className="animate-area-fade"
                          />
                          <path
                            d="M 28 90 L 65 82 L 105 68 L 150 52 L 190 36"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                            className="animate-draw-path"
                          />
                          {[28, 65, 105, 150, 190].map((cx, i) => {
                            const cy = [90, 82, 68, 52, 36][i];
                            return (
                              <circle key={i} cx={cx} cy={cy} r="2" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="0.8" className="animate-pop-dot" />
                            );
                          })}

                          {/* Actual Spent Area + Curve (On-load path draw animation) */}
                          <path
                            d="M 28 90 C 80 89, 120 78, 160 62 C 175 56, 183 52, 190 48 L 190 90 Z"
                            fill="url(#richActualGrad)"
                            className="animate-area-fade"
                          />
                          <path
                            d="M 28 90 C 80 89, 120 78, 160 62 C 175 56, 183 52, 190 48"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="1.8"
                            className="animate-draw-path"
                          />

                          {/* Current Milestone Vertical Line at x=190 with Sonar Radar Ping */}
                          <line x1="190" y1="14" x2="190" y2="90" stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
                          <circle cx="190" cy="48" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                          <circle cx="190" cy="48" r="6" fill="none" stroke="#10B981" strokeWidth="0.8" className="animate-ping origin-center" opacity="0.5" />



                          {/* Timeline X-Axis */}
                          <text x="28" y="102" textAnchor="start" fontSize="5.5" fill="#94A3B8">Oct &apos;26</text>
                          <text x="90" y="102" textAnchor="middle" fontSize="5.5" fill="#94A3B8">Feb &apos;27</text>
                          <text x="155" y="102" textAnchor="middle" fontSize="5.5" fill="#94A3B8">Jun &apos;27</text>
                          <text x="215" y="102" textAnchor="middle" fontSize="5.5" fill="#94A3B8">Nov &apos;27</text>
                          <text x="268" y="102" textAnchor="middle" fontSize="5.5" fill="#94A3B8">May &apos;28</text>
                          <text x="315" y="102" textAnchor="end" fontSize="5.5" fill="#94A3B8">Nov &apos;28</text>
                        </svg>
                      </div>
                    </div>

                    {/* Right 2 cols: Budget Utilization + Spend by Category Donut */}
                    <div className="col-span-2 bg-white p-2 rounded-lg shadow-2xs border border-gray-100 flex flex-col gap-2">
                      {/* Top: Budget Utilization Stacked Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[9px] font-bold text-[#3B7CED]">Budget Utilization</h3>
                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[7px] font-bold animate-pulse">
                            On Track
                          </span>
                        </div>
                        <div className="text-right text-[7.5px] text-gray-500 mb-1 font-medium">
                          <strong className="text-gray-800">₦982.5M</strong> / ₦2.45B (40.1%)
                        </div>
                        {/* 3-Segment Stacked Progress Bar with On-Load Grow */}
                        <div className="w-full h-2 flex rounded overflow-hidden mb-1.5 animate-bar-grow">
                          <div className="bg-[#10B981] h-full" style={{ width: "40.1%" }} title="Actual: 40.1%" />
                          <div className="bg-[#F59E0B] h-full" style={{ width: "25.1%" }} title="Committed: 25.1%" />
                          <div className="bg-[#E2E8F0] h-full" style={{ width: "34.8%" }} title="Available: 34.8%" />
                        </div>
                        {/* Stacked bar legend */}
                        <div className="flex gap-2 text-[6.5px] text-gray-500">
                          <div className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#10B981]" /><span>Actual 40.1%</span></div>
                          <div className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#F59E0B]" /><span>Committed 25.1%</span></div>
                          <div className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#E2E8F0]" /><span>Free 34.8%</span></div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100" />

                      {/* Bottom: Spend by Category Donut */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-[9px] font-bold text-[#3B7CED]">Spend by Category</h3>
                          <span className="text-[7px] text-gray-400 font-medium">Breakdown</span>
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          {/* Generous Donut Chart with On-Load Animated Segments */}
                          <div className="relative flex items-center justify-center shrink-0" style={{ width: "72px", height: "72px" }}>
                            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                              <circle cx="40" cy="40" r="32" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                              {/* Materials 42% */}
                              <circle
                                cx="40" cy="40" r="32"
                                fill="none"
                                stroke="#3B7CED"
                                strokeWidth="10"
                                strokeDasharray="84.45 201.06"
                                strokeDashoffset="0"
                                className="animate-donut-segment"
                              />
                              {/* Subcontracts 31% */}
                              <circle
                                cx="40" cy="40" r="32"
                                fill="none"
                                stroke="#F59E0B"
                                strokeWidth="10"
                                strokeDasharray="62.33 201.06"
                                strokeDashoffset="-84.45"
                                className="animate-donut-segment"
                              />
                              {/* Plant 18% */}
                              <circle
                                cx="40" cy="40" r="32"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="10"
                                strokeDasharray="36.19 201.06"
                                strokeDashoffset="-146.78"
                                className="animate-donut-segment"
                              />
                              {/* Labour 9% */}
                              <circle
                                cx="40" cy="40" r="32"
                                fill="none"
                                stroke="#8B5CF6"
                                strokeWidth="10"
                                strokeDasharray="18.10 201.06"
                                strokeDashoffset="-182.97"
                                className="animate-donut-segment"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
                              <span className="text-[6.5px] font-bold text-gray-700 leading-tight">SHARE</span>
                              <span className="text-[7px] font-bold text-gray-900 leading-tight">100%</span>
                            </div>
                          </div>

                          {/* Vertical Legend */}
                          <div className="flex flex-col gap-1.5 text-[7px] text-gray-600 font-medium flex-1">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#3B7CED] shrink-0" />
                              <span>Materials</span>
                              <span className="ml-auto font-bold text-gray-800">42%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                              <span>Subcontracts</span>
                              <span className="ml-auto font-bold text-gray-800">31%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                              <span>Plant</span>
                              <span className="ml-auto font-bold text-gray-800">18%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0" />
                              <span>Labour</span>
                              <span className="ml-auto font-bold text-gray-800">9%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Tabs Navigation Bar */}
                  <div className="flex items-center gap-4 border-b border-gray-200 pt-0.5 pr-4">
                    <span className="pb-1.5 text-[10.5px] font-semibold text-[#3B7CED] border-b-2 border-[#3B7CED]">
                      Phases & Activities
                    </span>
                    <span className="pb-1.5 text-[10.5px] font-medium text-gray-500 flex items-center gap-1">
                      <span>Budget Adjustments</span>
                      <span className="inline-flex items-center justify-center min-w-[13px] h-3 px-0.5 text-[7.5px] font-bold text-white bg-[#EF4444] rounded-full">
                        5
                      </span>
                    </span>
                    <span className="pb-1.5 text-[10.5px] font-medium text-gray-500">
                      Documents & Links
                    </span>
                    <span className="pb-1.5 text-[10.5px] font-medium text-gray-500">
                      Settings
                    </span>
                  </div>

                  {/* Project Phases & Activities Table (Bleeds smoothly off to the right) */}
                  <div className="bg-white rounded-lg shadow-2xs border border-gray-200 overflow-hidden w-[1140px]">
                    <div className="flex justify-between items-center px-3.5 py-1.5 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-[11px] font-semibold text-[#3B7CED]">
                        Project Phases & Activities
                      </h3>
                      <button
                        type="button"
                        className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 h-5 px-2 rounded text-[10px] font-medium"
                      >
                        See more
                      </button>
                    </div>

                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="py-1.5 pl-3 font-semibold w-10 text-center">S/N</th>
                          <th className="py-1.5 font-semibold w-64 min-w-[240px]">Activity</th>
                          <th className="py-1.5 font-semibold w-20">Quantity</th>
                          <th className="py-1.5 font-semibold w-24">Rate</th>
                          <th className="py-1.5 font-semibold w-32">Amount (Original)</th>
                          <th className="py-1.5 font-semibold w-32">Approved Revision</th>
                          <th className="py-1.5 font-semibold w-32">Current Budget</th>
                          <th className="py-1.5 font-semibold w-32">Actual Spent</th>
                          <th className="py-1.5 font-semibold w-28">Committed</th>
                          <th className="py-1.5 pr-4 font-semibold text-right w-28">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">

                        {/* Phase 1 */}
                        <tr className="bg-blue-50/40 border-y border-blue-100/60 font-semibold">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold text-[#3B7CED] uppercase tracking-wider">
                            Phase 1: Substructure & Deep Marine Piling
                          </td>
                          <td className="py-1.5 text-gray-800 font-bold">₦688,000,000</td>
                          <td className="py-1.5 text-emerald-600 font-bold">+₦24,500,000</td>
                          <td className="py-1.5 font-bold text-gray-900">₦712,500,000</td>
                          <td className="py-1.5 text-gray-600">₦712,500,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right text-emerald-600 font-bold">+₦0.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">1</td>
                          <td className="py-1.5 font-medium text-gray-900">Bored Cast-in-Situ Piling (800mm dia × 36m)</td>
                          <td className="py-1.5 text-gray-600">320 units</td>
                          <td className="py-1.5 text-gray-700">₦2,150,000</td>
                          <td className="py-1.5 text-gray-800">₦688,000,000</td>
                          <td className="py-1.5 text-emerald-600 font-semibold">+₦24,500,000</td>
                          <td className="py-1.5 font-bold text-gray-900">₦712,500,000</td>
                          <td className="py-1.5 text-gray-700">₦712,500,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦0.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">2</td>
                          <td className="py-1.5 font-medium text-gray-900">Continuous Reinforced Secant Retaining Wall</td>
                          <td className="py-1.5 text-gray-600">1,850 m²</td>
                          <td className="py-1.5 text-gray-700">₦145,000</td>
                          <td className="py-1.5 text-gray-800">₦268,250,000</td>
                          <td className="py-1.5 text-gray-400 font-medium">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦268,250,000</td>
                          <td className="py-1.5 text-gray-700">₦254,000,000</td>
                          <td className="py-1.5 text-amber-600">₦14,250,000</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦0.00</td>
                        </tr>

                        {/* Phase 2 */}
                        <tr className="bg-blue-50/40 border-y border-blue-100/60 font-semibold">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold text-[#3B7CED] uppercase tracking-wider">
                            Phase 2: Core Concrete Superstructure & Framing
                          </td>
                          <td className="py-1.5 text-gray-800 font-bold">₦1,015,000,000</td>
                          <td className="py-1.5 text-emerald-600 font-bold">+₦38,800,000</td>
                          <td className="py-1.5 font-bold text-gray-900">₦1,053,800,000</td>
                          <td className="py-1.5 text-gray-600">₦269,950,000</td>
                          <td className="py-1.5 text-amber-600">₦600,550,000</td>
                          <td className="py-1.5 pr-4 text-right text-emerald-600 font-bold">+₦48,200,000</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">3</td>
                          <td className="py-1.5 font-medium text-gray-900">Grade 45/20 Post-Tensioned Concrete Floor Slabs</td>
                          <td className="py-1.5 text-gray-600">5,800 m³</td>
                          <td className="py-1.5 text-gray-700">₦175,000</td>
                          <td className="py-1.5 text-gray-800">₦1,015,000,000</td>
                          <td className="py-1.5 text-emerald-600 font-semibold">+₦38,800,000</td>
                          <td className="py-1.5 font-bold text-gray-900">₦1,053,800,000</td>
                          <td className="py-1.5 text-gray-700">₦269,950,000</td>
                          <td className="py-1.5 text-amber-600">₦600,550,000</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦0.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">4</td>
                          <td className="py-1.5 font-medium text-gray-900">High-Tensile Structural Steel Reinforcement</td>
                          <td className="py-1.5 text-gray-600">840 tons</td>
                          <td className="py-1.5 text-gray-700">₦1,550,000</td>
                          <td className="py-1.5 text-gray-800">₦1,302,000,000</td>
                          <td className="py-1.5 text-gray-400 font-medium">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦1,302,000,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-amber-600">₦820,000,000</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦482,000,000</td>
                        </tr>

                        {/* Phase 3 */}
                        <tr className="bg-blue-50/40 border-y border-blue-100/60 font-semibold">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold text-[#3B7CED] uppercase tracking-wider">
                            Phase 3: Exterior Façade & Double-Glazed Curtain Wall
                          </td>
                          <td className="py-1.5 text-gray-800 font-bold">₦412,500,000</td>
                          <td className="py-1.5 text-gray-400 font-bold">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦412,500,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-amber-600">₦68,000,000</td>
                          <td className="py-1.5 pr-4 text-right text-gray-500 font-bold">₦344,500,000</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">5</td>
                          <td className="py-1.5 font-medium text-gray-900">Triple-Glazed Unitised Curtain Wall System (AA3105)</td>
                          <td className="py-1.5 text-gray-600">8,200 m²</td>
                          <td className="py-1.5 text-gray-700">₦50,300</td>
                          <td className="py-1.5 text-gray-800">₦412,460,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦412,460,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-amber-600">₦68,000,000</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦344,460,000</td>
                        </tr>

                        {/* Phase 4 */}
                        <tr className="bg-blue-50/40 border-y border-blue-100/60 font-semibold">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold text-[#3B7CED] uppercase tracking-wider">
                            Phase 4: MEP & Central HVAC Plant Engineering
                          </td>
                          <td className="py-1.5 text-gray-800 font-bold">₦225,000,000</td>
                          <td className="py-1.5 text-gray-400 font-bold">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦225,000,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right text-gray-400 font-bold">₦0.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">6</td>
                          <td className="py-1.5 font-medium text-gray-900">Variable Refrigerant Flow HVAC (Mitsubishi Electric VRF)</td>
                          <td className="py-1.5 text-gray-600">42 zones</td>
                          <td className="py-1.5 text-gray-700">₦2,800,000</td>
                          <td className="py-1.5 text-gray-800">₦117,600,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦117,600,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦0.00</td>
                        </tr>

                        {/* Phase 5 */}
                        <tr className="bg-blue-50/40 border-y border-blue-100/60 font-semibold">
                          <td colSpan={4} className="py-1.5 px-3 text-[9px] font-bold text-[#3B7CED] uppercase tracking-wider">
                            Phase 5: Interior Architectural Fit-Out & Finishes
                          </td>
                          <td className="py-1.5 text-gray-800 font-bold">₦109,500,000</td>
                          <td className="py-1.5 text-gray-400 font-bold">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦109,500,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right text-gray-400 font-bold">₦0.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-1.5 pl-3 text-gray-400 font-medium text-center">7</td>
                          <td className="py-1.5 font-medium text-gray-900">Italian Marble Flooring – Calacatta Gold (30mm honed)</td>
                          <td className="py-1.5 text-gray-600">6,400 m²</td>
                          <td className="py-1.5 text-gray-700">₦17,100</td>
                          <td className="py-1.5 text-gray-800">₦109,440,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 font-bold text-gray-900">₦109,440,000</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 text-gray-400">₦0.00</td>
                          <td className="py-1.5 pr-4 text-right font-medium text-gray-500">₦0.00</td>
                        </tr>

                      </tbody>
                    </table>

                    {/* Table Summary Footer */}
                    <div className="flex items-center justify-end px-4 py-2 bg-gray-50/90 border-t border-gray-200">
                      <div className="text-gray-600 text-[11px] flex items-center gap-5">
                        <span>Original Budget: <strong className="text-gray-900 font-semibold">₦2,450,000,000</strong></span>
                        <span>Approved Revision: <strong className="text-emerald-600 font-semibold">+₦63,300,000</strong></span>
                        <span>Total Project Budget: <strong className="text-gray-900 font-bold text-xs">₦2,513,300,000</strong></span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Content */}
      <div className="lg:w-1/2 lg:border">{children}</div>
    </div>
  );
};

export default AuthLayout;
