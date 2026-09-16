"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetProjectCostingProjectsQuery } from "@/api/projectCostingApi";
import { CustomMessage } from "@/components/shared/CustomMessage";
import { format } from "date-fns";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleWizard, WizardGuideButton } from "@/components/shared/wizard/ModuleWizard";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Awaiting Approval", value: "AWAITING APPROVAL" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
];

const getProjectManager = (project: any) => {
  if (project.project_manager_details) {
    const { first_name, last_name } = project.project_manager_details;
    if (first_name || last_name) {
      return `${first_name || ""} ${last_name || ""}`.trim();
    }
  }
  return project.client_name || "Unknown";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    return format(new Date(dateStr), "MMM-dd-yyyy");
  } catch (e) {
    return dateStr;
  }
};

const getProjectBudget = (project: any) => {
  const amount =
    project.financials?.budget ??
    project.budget ??
    project.total_budget ??
    project.contract_amount ??
    0;
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
      : Number(amount);
  return `₦${(isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const renderStatusBadge = (status?: string) => {
  const upper = (status || "DRAFT").toUpperCase();
  if (upper === "ACTIVE" || upper === "APPROVED") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E2F2E9] text-[#1E8E3E] min-w-[80px]">
        Active
      </span>
    );
  }
  if (
    upper === "AWAITING APPROVAL" ||
    upper === "PENDING" ||
    upper === "PENDING_APPROVAL" ||
    upper.includes("AWAITING")
  ) {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF2CC] text-[#D66011] min-w-[130px]">
        Awaiting Approval
      </span>
    );
  }
  if (upper === "REJECTED") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F] min-w-[80px]">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] min-w-[80px]">
      Draft
    </span>
  );
};

export default function ProjectCostingListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
  } = useGetProjectCostingProjectsQuery({
    search,
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status matching
      let matchesStatus = true;
      if (selectedStatus !== "all") {
        const upperStatus = (project.status || "DRAFT").toUpperCase();
        if (selectedStatus === "ACTIVE") {
          matchesStatus =
            upperStatus === "ACTIVE" || upperStatus === "APPROVED";
        } else if (selectedStatus === "AWAITING APPROVAL") {
          matchesStatus =
            upperStatus === "AWAITING APPROVAL" ||
            upperStatus === "PENDING" ||
            upperStatus === "PENDING_APPROVAL" ||
            upperStatus.includes("AWAITING");
        } else if (selectedStatus === "REJECTED") {
          matchesStatus = upperStatus === "REJECTED";
        } else if (selectedStatus === "DRAFT") {
          matchesStatus = upperStatus === "DRAFT" || !project.status;
        } else {
          matchesStatus = upperStatus === selectedStatus;
        }
      }

      // Search matching
      let matchesSearch = true;
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (project.project_code || "").toLowerCase();
        const name = (project.name || "").toLowerCase();
        const manager = getProjectManager(project).toLowerCase();
        const type = (project.project_type || "").toLowerCase();
        matchesSearch =
          code.includes(q) ||
          name.includes(q) ||
          manager.includes(q) ||
          type.includes(q);
      }

      return matchesStatus && matchesSearch;
    });
  }, [projects, selectedStatus, search]);

  const handleRowClick = (id: number) => {
    router.push(`/project-costing/${id}`);
  };

  return (
    <PageGuard module="project_costing" entitlement="view_project">
    <div className="w-full flex flex-col bg-transparent">
      {/* Breadcrumbs */}
      <div className="px-4 pt-4 flex items-center gap-1 text-sm text-[#8898AA] mb-4 font-normal">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Home
        </Link>
        <span className="text-gray-300 mx-0.5">\</span>
        <span className="text-[#32325D] font-normal">Project Costing</span>
      </div>

      {/* Top Bar Actions & Title */}

      <div>
        <div className="bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-[#32325D]">
              Project Costing
            </h1>
            <div className="relative w-[240px]  md:w-[320px] ">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search"
                className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <WizardGuideButton moduleId="project-costing" />

            <PermissionGuard module="project_costing" entitlement="create_project">
              <Link href="/project-costing/new" data-wizard="pc-new-project">
                <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                  New Project
                </Button>
              </Link>
            </PermissionGuard>

            {/* Grid / List View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white gap-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-blue-50 text-[#3B7CED] font-medium"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  viewMode === "list"
                    ? "bg-blue-50 text-[#3B7CED] font-medium"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                title="List View"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div data-wizard="pc-status-tabs" className="bg-white p-4 flex items-center gap-2 flex-wrap mb-6">
          {STATUS_TABS.map((tab) => {
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

      {/* Status Filter Pills */}

      {/* Main Content Area: List View vs Grid View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full"
        >
          {viewMode === "list" ? (
            <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <Table data-wizard="pc-table-row">
                  <TableHeader>
                    <TableRow className="bg-[#F6F9FC] hover:bg-[#F6F9FC] border-b border-gray-100">
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Project Code
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Project Name
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Project Manager
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Project Type
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Start Date
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        End Date
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Project Budget
                      </TableHead>
                      <TableHead className="font-semibold text-[#8898AA] text-[11.5px] py-3.5 px-6 whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={`list-skeleton-${idx}`}>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-40 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-28 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                          <TableCell className="py-3.5 px-6"><Skeleton className="h-6 w-20 bg-gray-100 rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8">
                          <CustomMessage
                            variant="error"
                            title="We couldn't load your projects right now"
                            message="There seems to be a temporary network or server issue while fetching project costing data. Please check your connection and click below to try again."
                            onRetry={() => refetch()}
                            retryText="Retry Loading"
                            className="text-center border"
                          />
                        </TableCell>
                      </TableRow>
                    ) : filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8">
                          <CustomMessage
                            variant="empty"
                            title={
                              search || selectedStatus !== "all"
                                ? "No matching projects found"
                                : "No projects created yet"
                            }
                            message={
                              search || selectedStatus !== "all"
                                ? "We couldn't find any projects matching your current search or status filters."
                                : "You don't have any project costing entries yet. Click the 'New Project' button above to get started."
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project, index) => (
                        <TableRow
                          key={project.id || index}
                          className="cursor-pointer hover:bg-gray-50/50 border-b border-[#E9ECEF] transition-colors"
                          onClick={() => handleRowClick(project.id)}
                        >
                          <TableCell className="text-[#32325D] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {project.project_code || "N/A"}
                          </TableCell>
                          <TableCell className="text-[#32325D] font-semibold text-sm py-3.5 px-6 whitespace-nowrap">
                            {project.name || "Untitled Project"}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {getProjectManager(project)}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {project.project_type || "Fixed Price"}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {formatDate(project.start_date)}
                          </TableCell>
                          <TableCell className="text-[#525F7F] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {formatDate(project.expected_end_date)}
                          </TableCell>
                          <TableCell className="text-[#32325D] font-normal text-sm py-3.5 px-6 whitespace-nowrap">
                            {getProjectBudget(project)}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 whitespace-nowrap">
                            {renderStatusBadge(project.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={`grid-skeleton-${idx}`} className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Skeleton className="h-5 w-16 bg-gray-100 rounded-md" />
                          <Skeleton className="h-5 w-20 bg-gray-100 rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-3/4 bg-gray-100 mb-2" />
                        <Skeleton className="h-4 w-1/4 bg-gray-100" />
                      </div>
                      <div className="border-t border-gray-100 my-4 pt-3 flex items-center justify-between gap-4">
                        <div>
                          <Skeleton className="h-3 w-12 bg-gray-100 mb-1" />
                          <Skeleton className="h-4 w-16 bg-gray-100" />
                        </div>
                        <div>
                          <Skeleton className="h-3 w-12 bg-gray-100 mb-1" />
                          <Skeleton className="h-4 w-20 bg-gray-100" />
                        </div>
                        <div>
                          <Skeleton className="h-3 w-12 bg-gray-100 mb-1" />
                          <Skeleton className="h-4 w-16 bg-gray-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <CustomMessage
                  variant="error"
                  title="We couldn't load your projects right now"
                  message="There seems to be a temporary network or server issue while fetching project costing data. Please check your connection and click below to try again."
                  onRetry={() => refetch()}
                  retryText="Retry Loading"
                  className="my-4 bg-white"
                />
              ) : filteredProjects.length === 0 ? (
                <CustomMessage
                  variant="empty"
                  title={
                    search || selectedStatus !== "all"
                      ? "No matching projects found"
                      : "No projects created yet"
                  }
                  message={
                    search || selectedStatus !== "all"
                      ? "We couldn't find any projects matching your current search or status filters. ."
                      : "You don't have any project costing entries yet. Click the 'New Project' button above to get started."
                  }
                  className="my-4 bg-white"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProjects.map((project, index) => (
                    <div
                      key={project.id || index}
                      onClick={() => handleRowClick(project.id)}
                      className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md hover:border-blue-200/80 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md tracking-wide">
                            {project.project_code || "N/A"}
                          </span>
                          {renderStatusBadge(project.status)}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#3B7CED] transition-colors line-clamp-1 mb-1">
                          {project.name || "Untitled Project"}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {project.project_type || "Fixed Price"}
                        </p>
                      </div>

                      <div className="border-t border-gray-100 my-4 pt-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">
                            Start Date
                          </span>
                          <span className="font-medium text-gray-700 mt-0.5 block">
                            {formatDate(project.start_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">
                            Manager
                          </span>
                          <span className="font-medium text-gray-700 mt-0.5 block">
                            {getProjectManager(project)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">
                            Budget
                          </span>
                          <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                            {getProjectBudget(project)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <ModuleWizard moduleId="project-costing" />
    </div>
    </PageGuard>
  );
}
