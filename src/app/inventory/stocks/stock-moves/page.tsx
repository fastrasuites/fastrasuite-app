"use client";

import React, { useMemo, useState } from "react";
import { BreadcrumbItem } from "@/components/shared/types";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { PageGuard } from "@/components/auth/PageGuard";
import { StockMoveTable } from "@/components/inventory/stocks/StockMoveTable";
import { StockMoveCards } from "@/components/inventory/stocks/StockMoveCards";
import { useGetStockMovesQuery } from "@/api/inventory/stockMoveApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  Loader2,
  List,
  LayoutGrid,
  Package,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StockMovesPage() {
  const { data: movesResponse, isLoading, isError } = useGetStockMovesQuery({});
  const moves = (movesResponse as any)?.results || (Array.isArray(movesResponse) ? movesResponse : []);

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [currentView, setCurrentView] = useState<"list" | "grid">("list");

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("ALL");
  const [selectedWbsPhase, setSelectedWbsPhase] = useState("ALL");
  const [selectedWbsActivity, setSelectedWbsActivity] = useState("ALL");

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Stock Moves", href: "/inventory/stocks/stock-moves", current: true },
  ];

  // Extract unique options for dropdowns
  const productsList = useMemo(() => {
    const set = new Set<string>();
    moves.forEach((m: any) => {
      if (m.product_details?.product_name) set.add(m.product_details.product_name);
    });
    return Array.from(set).sort();
  }, [moves]);

  const phasesList = useMemo(() => {
    const set = new Set<string>();
    moves.forEach((m: any) => {
      const val = typeof m.wbs_phase === "object" ? m.wbs_phase?.name || m.wbs_phase?.id : m.wbs_phase;
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [moves]);

  const activitiesList = useMemo(() => {
    const set = new Set<string>();
    moves.forEach((m: any) => {
      const val = typeof m.wbs_activity === "object" ? m.wbs_activity?.name || m.wbs_activity?.id : m.wbs_activity;
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [moves]);

  // Metric Summary Cards calculation matching Fastra Suite style
  const metricCards = useMemo(() => {
    const incoming = moves.filter(
      (m: any) => m.move_type === "INCOMING" || m.move_type === "Receipt"
    ).length;
    const outgoing = moves.filter(
      (m: any) =>
        m.move_type === "CONSUMPTION" ||
        m.move_type === "Consumption" ||
        m.move_type === "SCRAP" ||
        m.move_type === "Scrap" ||
        m.move_type === "OUTGOING"
    ).length;
    const transfer = moves.filter((m: any) => m.move_type === "TRANSFER").length;

    return [
      {
        title: "Total Moves",
        count: moves.length,
        icon: Package,
        color: "#3B7CED",
        typeValue: "ALL",
      },
      {
        title: "Incoming Receipts",
        count: incoming,
        icon: CheckCircle2,
        color: "#1E8E3E",
        typeValue: "INCOMING",
      },
      {
        title: "Outgoing & Scrap",
        count: outgoing,
        icon: AlertOctagon,
        color: "#E43D2B",
        typeValue: "OUTGOING",
      },
      {
        title: "Internal Transfers",
        count: transfer,
        icon: ArrowRightLeft,
        color: "#F0B401",
        typeValue: "TRANSFER",
      },
    ];
  }, [moves]);

  const filteredMoves = useMemo(() => {
    return moves.filter((move: any) => {
      // 1. Transaction Type filter
      if (selectedType !== "ALL") {
        const type = selectedType.toUpperCase();
        if (type === "INCOMING" && !(move.move_type === "INCOMING" || move.move_type === "Receipt")) return false;
        if (type === "OUTGOING" && !(move.move_type === "CONSUMPTION" || move.move_type === "Consumption" || move.move_type === "SCRAP" || move.move_type === "Scrap" || move.move_type === "OUTGOING")) return false;
        if (type === "TRANSFER" && move.move_type !== "TRANSFER") return false;
      }
      
      // 2. Product filter
      if (selectedProduct !== "ALL" && move.product_details?.product_name !== selectedProduct) {
        return false;
      }

      // 3. WBS Phase filter
      const phaseVal = typeof move.wbs_phase === "object" ? move.wbs_phase?.name || move.wbs_phase?.id : move.wbs_phase;
      if (selectedWbsPhase !== "ALL" && phaseVal !== selectedWbsPhase) {
        return false;
      }

      // 4. WBS Activity filter
      const activityVal = typeof move.wbs_activity === "object" ? move.wbs_activity?.name || move.wbs_activity?.id : move.wbs_activity;
      if (selectedWbsActivity !== "ALL" && activityVal !== selectedWbsActivity) {
        return false;
      }

      // 5. Date Range filter
      if (dateFrom && move.date_moved) {
        if (new Date(move.date_moved.split('T')[0]) < new Date(dateFrom)) return false;
      }
      if (dateTo && move.date_moved) {
        if (new Date(move.date_moved.split('T')[0]) > new Date(dateTo)) return false;
      }

      // 6. Search query filter
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const searchPhaseVal = typeof move.wbs_phase === "object" ? move.wbs_phase?.name || move.wbs_phase?.id : move.wbs_phase;
      const searchActivityVal = typeof move.wbs_activity === "object" ? move.wbs_activity?.name || move.wbs_activity?.id : move.wbs_activity;
      return (
        String(move.id).toLowerCase().includes(q) ||
        (move.product_details?.product_name && move.product_details.product_name.toLowerCase().includes(q)) ||
        (move.reference && move.reference.toLowerCase().includes(q)) ||
        (searchPhaseVal && String(searchPhaseVal).toLowerCase().includes(q)) ||
        (searchActivityVal && String(searchActivityVal).toLowerCase().includes(q))
      );
    });
  }, [moves, query, selectedType, selectedProduct, selectedWbsPhase, selectedWbsActivity, dateFrom, dateTo]);

  const exportToCSV = () => {
    if (filteredMoves.length === 0) return;

    const headers = [
      "Date",
      "Move ID",
      "Reference Document",
      "Type",
      "Product Name",
      "Quantity",
      "Running Balance",
      "WBS Phase",
      "WBS Activity",
      "User"
    ];

    const rows = filteredMoves.map((move: any) => {
      const user = move.moved_by_details?.first_name 
        ? `${move.moved_by_details.first_name} ${move.moved_by_details.last_name || ""}`.trim()
        : "System Admin";

      const phaseVal = typeof move.wbs_phase === "object" ? move.wbs_phase?.name || move.wbs_phase?.id || "" : move.wbs_phase || "";
      const activityVal = typeof move.wbs_activity === "object" ? move.wbs_activity?.name || move.wbs_activity?.id || "" : move.wbs_activity || "";

      return [
        move.date_moved || "",
        move.id || "",
        move.reference || "",
        move.move_type || "",
        move.product_details?.product_name || "",
        move.quantity || "",
        move.running_balance || "",
        phaseVal,
        activityVal,
        user
      ];
    });

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map((e: any) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageGuard module="inventory" entitlement="view_inventory">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F8FAFC] pb-16 font-open-sans">
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col gap-6 font-open-sans">
          <Breadcrumbs items={items} />

          {/* Metric Summary Cards matching Fastra Suite StatusCards style */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-2xs overflow-hidden font-open-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((card, idx) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setSelectedType(card.typeValue)}
                  className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col text-left ${
                    idx < 3 ? "border-b" : ""
                  } ${
                    idx % 2 === 0 ? "sm:border-r" : ""
                  } ${
                    idx < 2 ? "sm:border-b" : "sm:border-b-0"
                  } ${
                    idx < 3 ? "lg:border-r lg:border-b-0" : "lg:border-r-0"
                  } border-gray-100 ${
                    selectedType === card.typeValue ? "bg-gray-50/70" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <card.icon
                      className="w-[18px] h-[18px] shrink-0"
                      style={{ color: card.color }}
                    />
                    <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors leading-tight">
                      {card.title}
                    </span>
                  </div>
                  <div
                    className="text-[2rem] font-bold"
                    style={{ color: card.color }}
                  >
                    {card.count}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-xl shadow-2xs border border-gray-100 overflow-hidden font-open-sans">
            {/* Header & Controls */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 font-open-sans">
              <h2 className="text-lg font-semibold text-gray-800">
                Inventory Ledger
              </h2>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Box */}
                <div className="relative w-64 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search reference, product, WBS..."
                    className="pl-9 bg-gray-50/50 border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] font-open-sans"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {/* Type Filter */}
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-[150px] h-9 text-xs bg-white border-gray-200 rounded-lg font-open-sans">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="font-open-sans">
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INCOMING">Incoming</SelectItem>
                    <SelectItem value="OUTGOING">Outgoing</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>

                {/* Advanced Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-9 text-xs border-gray-200 rounded-lg font-open-sans ${
                    showFilters ? "bg-blue-50 text-[#3B7CED] border-blue-200" : "text-[#525F7F]"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Filters
                </Button>

                {/* Export CSV */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={filteredMoves.length === 0}
                  className="h-9 text-xs border-gray-200 rounded-lg text-[#525F7F] font-open-sans"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export CSV
                </Button>

                {/* View Toggle (List / Grid) */}
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => setCurrentView("list")}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      currentView === "list" ? "bg-white text-[#3B7CED] shadow-2xs" : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView("grid")}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      currentView === "grid" ? "bg-white text-[#3B7CED] shadow-2xs" : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Filters Bar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-[#F8FAFC]/70 border-b border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 font-open-sans"
                >
                  {/* Date From */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] bg-white font-open-sans"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] bg-white font-open-sans"
                    />
                  </div>

                  {/* Product */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] bg-white font-open-sans"
                    >
                      <option value="ALL">All Products</option>
                      {productsList.map((prod) => (
                        <option key={prod} value={prod}>{prod}</option>
                      ))}
                    </select>
                  </div>

                  {/* WBS Phase */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">WBS Phase</label>
                    <select
                      value={selectedWbsPhase}
                      onChange={(e) => setSelectedWbsPhase(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] bg-white font-open-sans"
                    >
                      <option value="ALL">All Phases</option>
                      {phasesList.map((phase) => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </div>

                  {/* WBS Activity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">WBS Activity</label>
                    <select
                      value={selectedWbsActivity}
                      onChange={(e) => setSelectedWbsActivity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3B7CED] bg-white font-open-sans"
                    >
                      <option value="ALL">All Activities</option>
                      {activitiesList.map((act) => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                        setSelectedProduct("ALL");
                        setSelectedWbsPhase("ALL");
                        setSelectedWbsActivity("ALL");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 font-open-sans"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table or Cards Content */}
            {isLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm font-open-sans">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3B7CED]" />
                  <span>Loading stock moves...</span>
                </div>
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500 text-sm font-open-sans">
                Failed to load stock moves. Please try again.
              </div>
            ) : currentView === "list" ? (
              <StockMoveTable moves={filteredMoves} query="" />
            ) : (
              <div className="p-6 font-open-sans">
                <StockMoveCards moves={filteredMoves} />
              </div>
            )}
          </div>
        </main>
      </div>
    </PageGuard>
  );
}
