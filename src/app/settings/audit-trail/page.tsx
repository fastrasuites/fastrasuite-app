"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  History,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileEdit,
  PlusCircle,
  LogIn,
  User,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useGetAuditTrailsQuery } from "@/api/settings/auditTrailApi";
import { AuditTrail } from "@/types/auditTrail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/types/purchase";
import {
  formatActorDisplay,
  formatFriendlyDate,
  getActionBadgeConfig,
} from "@/utils/auditTrailUtils";

export default function AuditTrailListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedActionType, setSelectedActionType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"-created_at" | "created_at">("-created_at");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const { data: rawAuditTrails, isLoading, isFetching, refetch } = useGetAuditTrailsQuery({
    search: searchTerm || undefined,
    ordering: sortOrder,
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings/company/1" },
    { label: "Audit Trail", href: "/settings/audit-trail", current: true },
  ];

  // Stats calculation
  const stats = useMemo(() => {
    const total = rawAuditTrails?.length || 0;
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let approvals = 0;

    rawAuditTrails?.forEach((item) => {
      const act = (item.action || "").toUpperCase();
      if (act.includes("CREATE") || act.includes("ADD") || act.includes("NEW")) creates++;
      else if (act.includes("UPDATE") || act.includes("PATCH") || act.includes("EDIT")) updates++;
      else if (act.includes("DELETE") || act.includes("CANCEL")) deletes++;
      else if (act.includes("APPROVE") || act.includes("VALIDATE") || act.includes("SUBMIT")) approvals++;
    });

    return { total, creates, updates, deletes, approvals };
  }, [rawAuditTrails]);

  // Extract available modules
  const availableModules = useMemo(() => {
    const mods = new Set<string>();
    rawAuditTrails?.forEach((item) => {
      if (item.module) mods.add(item.module);
    });
    return Array.from(mods).sort();
  }, [rawAuditTrails]);

  // Filter client-side
  const filteredList = useMemo(() => {
    if (!rawAuditTrails) return [];
    return rawAuditTrails.filter((item) => {
      if (selectedModule !== "all" && item.module?.toLowerCase() !== selectedModule.toLowerCase()) {
        return false;
      }
      if (selectedActionType !== "all") {
        const act = (item.action || "").toUpperCase();
        if (selectedActionType === "create" && !(act.includes("CREATE") || act.includes("ADD") || act.includes("NEW"))) return false;
        if (selectedActionType === "update" && !(act.includes("UPDATE") || act.includes("PATCH") || act.includes("EDIT"))) return false;
        if (selectedActionType === "delete" && !(act.includes("DELETE") || act.includes("CANCEL"))) return false;
        if (selectedActionType === "approve" && !(act.includes("APPROVE") || act.includes("VALIDATE") || act.includes("SUBMIT"))) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const actor = formatActorDisplay(item).toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const mod = (item.module || "").toLowerCase();
        const act = (item.action || "").toLowerCase();
        const ip = (item.ip_address || "").toLowerCase();
        return actor.includes(q) || desc.includes(q) || mod.includes(q) || act.includes(q) || ip.includes(q);
      }
      return true;
    });
  }, [rawAuditTrails, selectedModule, selectedActionType, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] pb-20">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Top Header Card */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#E8F0FE] text-[#1A73E8]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[#32325D]">
                  Audit Trail & Activity Log
                </h1>
                <span className="inline-block px-3 py-1 text-xs rounded-full font-semibold bg-[#E8F0FE] text-[#1A73E8]">
                  {stats.total} Total Events
                </span>
              </div>
              <p className="text-xs text-[#8898AA] mt-1">
                Transparent log of changes, updates, user actions, and system activity records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin text-[#1A73E8]" : "text-gray-500"}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Summary Stat Tiles (Matches Inventory Operations format) */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-2xs overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <button
              onClick={() => { setSelectedActionType("all"); setPage(1); }}
              className={`p-4 text-left hover:bg-gray-50/80 transition-colors flex flex-col justify-between ${
                selectedActionType === "all" ? "bg-blue-50/40 ring-1 ring-[#3B7CED] inset-0" : ""
              }`}
            >
              <span className="text-[12px] font-semibold text-[#8898AA] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#3B7CED]" /> All Activities
              </span>
              <span className="text-2xl font-bold text-[#32325D] mt-2">{stats.total}</span>
            </button>

            <button
              onClick={() => { setSelectedActionType("create"); setPage(1); }}
              className={`p-4 text-left hover:bg-gray-50/80 transition-colors flex flex-col justify-between ${
                selectedActionType === "create" ? "bg-emerald-50/40 ring-1 ring-emerald-500" : ""
              }`}
            >
              <span className="text-[12px] font-semibold text-[#8898AA] flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#2BA24D]" /> Records Created
              </span>
              <span className="text-2xl font-bold text-[#2BA24D] mt-2">{stats.creates}</span>
            </button>

            <button
              onClick={() => { setSelectedActionType("update"); setPage(1); }}
              className={`p-4 text-left hover:bg-gray-50/80 transition-colors flex flex-col justify-between ${
                selectedActionType === "update" ? "bg-blue-50/40 ring-1 ring-blue-500" : ""
              }`}
            >
              <span className="text-[12px] font-semibold text-[#8898AA] flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-[#1A73E8]" /> Record Updates
              </span>
              <span className="text-2xl font-bold text-[#1A73E8] mt-2">{stats.updates}</span>
            </button>

            <button
              onClick={() => { setSelectedActionType("delete"); setPage(1); }}
              className={`p-4 text-left hover:bg-gray-50/80 transition-colors flex flex-col justify-between ${
                selectedActionType === "delete" ? "bg-rose-50/40 ring-1 ring-rose-500" : ""
              }`}
            >
              <span className="text-[12px] font-semibold text-[#8898AA] flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-[#C5221F]" /> Deletions & Voided
              </span>
              <span className="text-2xl font-bold text-[#C5221F] mt-2">{stats.deletes}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8898AA]" />
            <Input
              type="text"
              placeholder="Search by action, person, module, or details..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-sm bg-[#F6F9FC] border-gray-200 focus:bg-white transition-all h-9.5"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Module Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8898AA] hidden sm:inline">Module:</span>
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-medium bg-[#F6F9FC] border border-gray-200 rounded-md px-3 py-2 text-[#32325D] focus:outline-none focus:ring-1 focus:ring-[#3B7CED] cursor-pointer"
              >
                <option value="all">All Modules</option>
                {availableModules.map((mod) => (
                  <option key={mod} value={mod.toLowerCase()}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortOrder((prev) => (prev === "-created_at" ? "created_at" : "-created_at"));
                setPage(1);
              }}
              className="text-xs font-medium text-[#32325D] border-gray-200 h-9"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-[#8898AA]" />
              {sortOrder === "-created_at" ? "Newest First" : "Oldest First"}
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2">
                  <Skeleton className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-36 animate-pulse" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  <Skeleton className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                  <Skeleton className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#32325D]">No Activity Records Found</h3>
              <p className="text-xs text-[#8898AA] mt-1 max-w-sm mx-auto">
                {searchTerm || selectedModule !== "all" || selectedActionType !== "all"
                  ? "No activity logs match your current search and filter settings."
                  : "Activity events will show up here as actions are performed across your organization."}
              </p>
              {(searchTerm || selectedModule !== "all" || selectedActionType !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedModule("all");
                    setSelectedActionType("all");
                    setPage(1);
                  }}
                  className="mt-4 text-xs font-semibold border-gray-200 text-[#1A73E8]"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-gray-100 text-[11.5px] font-semibold text-[#8898AA] uppercase tracking-wider">
                    <th className="py-3 px-6">Date & Time</th>
                    <th className="py-3 px-6">Performed By</th>
                    <th className="py-3 px-6">Action</th>
                    <th className="py-3 px-6">Module</th>
                    <th className="py-3 px-6">Summary of Activity</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedList.map((item) => {
                    const badge = getActionBadgeConfig(item.action);
                    const IconComponent = badge.icon;
                    const actorName = formatActorDisplay(item);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/settings/audit-trail/${item.id}`)}
                        className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-6 whitespace-nowrap text-xs text-[#525F7F] font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8898AA]" />
                            <span>{formatFriendlyDate(item.created_at)}</span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs flex items-center justify-center border border-blue-100">
                              {actorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-xs text-[#32325D]">{actorName}</span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Module */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className="text-xs font-medium text-[#525F7F] bg-gray-100 px-2 py-0.5 rounded">
                            {item.module || "System"}
                          </span>
                        </td>

                        {/* Description / Summary */}
                        <td className="py-3.5 px-6 text-xs text-[#32325D] max-w-sm truncate">
                          {item.description || (
                            <span className="text-[#8898AA] italic">Activity performed on {item.module || "system"}</span>
                          )}
                        </td>

                        {/* Detail Link Button */}
                        <td className="py-3.5 px-6 whitespace-nowrap text-right text-xs">
                          <Link
                            href={`/settings/audit-trail/${item.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#3B7CED] hover:text-[#285ec2] font-semibold py-1 px-2.5 rounded hover:bg-blue-50 transition"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-[#F8FAFC] border-t border-gray-100 text-xs text-[#8898AA]">
              <span>
                Showing <strong className="text-[#32325D]">{(page - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-[#32325D]">
                  {Math.min(page * pageSize, filteredList.length)}
                </strong>{" "}
                of <strong className="text-[#32325D]">{filteredList.length}</strong> records
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2 text-xs font-semibold text-[#525F7F] border-gray-200"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <span className="px-2 font-medium text-[#32325D]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2 text-xs font-semibold text-[#525F7F] border-gray-200"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
