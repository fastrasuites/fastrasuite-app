"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/components/shared/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetInventoryUnitOfMeasuresQuery } from "@/api/inventory/unitOfMeasureApi";

const getStatusVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "validated";
    case "INACTIVE":
      return "rejected";
    default:
      return "draft";
  }
};

export default function UnitsOfMeasurePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: rawUnits,
    isLoading,
    error,
  } = useGetInventoryUnitOfMeasuresQuery({});

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Configuration", href: "/inventory/configuration" },
    { label: "Units of Measure", href: "/inventory/configuration/units-of-measure", current: true },
  ];

  const unitsList = useMemo(() => {
    if (!rawUnits) return [];
    if (Array.isArray(rawUnits)) return rawUnits;
    if ((rawUnits as any).results && Array.isArray((rawUnits as any).results)) {
      return (rawUnits as any).results;
    }
    return [];
  }, [rawUnits]);

  const getUnitId = (u: any, idx: number) => {
    if (u.id !== undefined && !isNaN(Number(u.id))) return u.id;
    if (u.url) {
      const parts = u.url.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (!isNaN(Number(last))) return last;
    }
    return idx + 1;
  };

  const handleRowClick = (id: string | number) => {
    router.push(`/inventory/configuration/units-of-measure/${id}`);
  };

  const filteredUnits = useMemo(() => {
    return unitsList.filter((u: any) => {
      if (!u) return false;
      const nameStr = String(u.unit_name || u.name || "").toLowerCase();
      const symbolStr = String(
        u.unit_symbol || u.abbreviation || ""
      ).toLowerCase();
      const catStr = String(u.unit_category || u.category || "").toLowerCase();
      const matchQuery =
        !search.trim() ||
        nameStr.includes(search.toLowerCase()) ||
        symbolStr.includes(search.toLowerCase()) ||
        catStr.includes(search.toLowerCase());

      const statusStr = u.is_active !== false ? "ACTIVE" : "INACTIVE";
      const matchStatus =
        selectedStatus === "all" || statusStr === selectedStatus.toUpperCase();
      return matchQuery && matchStatus;
    });
  }, [unitsList, search, selectedStatus]);

  return (
    <PageGuard module="inventory" entitlement="view_unitofmeasure">
      {/* Two-tone: gray canvas */}
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] relative pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Breadcrumbs
            items={items}
            action={
              <Button variant="ghost" className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors">
                Autosaved <AutoSaveIcon />
              </Button>
            }
          />

          {/* White Header Control Card with Filter Pills */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            {/* Top Bar: title + search + actions */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-[#32325D] shrink-0">Units of Measure</h1>
                <div className="relative w-[240px] md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search unit name or symbol..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-white border-gray-200 rounded-lg h-9 text-sm w-full focus:ring-1 focus:ring-[#3B7CED] text-[#32325D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <PermissionGuard module="inventory" entitlement="add_unitofmeasure">
                  <Link href="/inventory/configuration/units-of-measure/new">
                    <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> New Unit
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
              {[
                { label: "All Units", value: "all" },
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ].map((tab) => {
                const isSelected = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedStatus(tab.value)}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#E8F0FE] text-[#1A73E8] font-semibold"
                        : "bg-[#E9ECEF] text-[#8898AA] font-normal hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap w-64">
                      Unit Name
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap w-40">
                      Symbol / Abbr
                    </TableHead>
                    <TableHead className="py-3.5 px-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap">
                      Category
                    </TableHead>
                    <TableHead className="py-3.5 pr-6 font-semibold text-[#8898AA] text-[11.5px] whitespace-nowrap text-center w-36">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2 text-[#8898AA] text-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-[#3B7CED]" />
                          <span>Loading units of measure...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading &&
                    filteredUnits.map((u: any, idx: number) => {
                      const id = getUnitId(u, idx);
                      const statusStr = u.is_active !== false ? "ACTIVE" : "INACTIVE";
                      return (
                        <TableRow
                          key={id}
                          className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
                          onClick={() => handleRowClick(id)}
                        >
                          <TableCell className="px-6 py-3.5 text-sm font-semibold text-[#32325D] whitespace-nowrap">
                            {u.unit_name || u.name}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 font-mono text-sm font-bold text-[#3B7CED] whitespace-nowrap">
                            {u.unit_symbol || u.abbreviation || "-"}
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-[#525F7F] whitespace-nowrap">
                            {u.unit_category || u.category || "General"}
                          </TableCell>
                          <TableCell className="pr-6 py-3.5 text-center whitespace-nowrap">
                            <Badge
                              variant={getStatusVariant(statusStr) as any}
                              className="px-2.5 py-0.5 font-semibold text-xs shadow-none"
                            >
                              {statusStr}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {!isLoading && filteredUnits.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-[#8898AA] text-sm"
                      >
                        No units of measure found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </PageGuard>
  );
}
