"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  User,
  ShieldCheck,
  Globe,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  PlusCircle,
  FileEdit,
  XCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";
import { useGetAuditTrailByIdQuery } from "@/api/settings/auditTrailApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/types/purchase";
import {
  formatActorDisplay,
  formatFriendlyDate,
  getActionBadgeConfig,
} from "@/utils/auditTrailUtils";

// Parse arbitrary JSON / string into a clean object
function toObject(val: any): Record<string, any> | null {
  if (!val) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object") return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

// Convert camelCase or snake_case key into Title Case (e.g. "unit_price" -> "Unit Price")
function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Human-friendly representation of any value
function formatFieldValue(val: any): string {
  if (val === null || val === undefined || val === "") {
    return "None (empty)";
  }
  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.length === 0 ? "Empty list" : `${val.length} item(s)`;
    }
    return JSON.stringify(val);
  }
  return String(val);
}

// Compare old_values and new_values to compute field diffs
interface FieldChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  type: "added" | "modified" | "removed" | "unchanged";
}

function computeFieldChanges(oldValRaw: any, newValRaw: any): FieldChange[] {
  const oldObj = toObject(oldValRaw) || {};
  const newObj = toObject(newValRaw) || {};

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  const changes: FieldChange[] = [];

  allKeys.forEach((key) => {
    // Ignore internal keys if not useful
    if (["password", "secret", "hash"].includes(key.toLowerCase())) return;

    const hasOld = key in oldObj;
    const hasNew = key in newObj;
    const oldV = oldObj[key];
    const newV = newObj[key];

    const isSame =
      JSON.stringify(oldV) === JSON.stringify(newV) ||
      (oldV == null && newV == null);

    if (!hasOld && hasNew) {
      changes.push({
        fieldName: key,
        fieldLabel: formatFieldLabel(key),
        oldValue: null,
        newValue: newV,
        type: "added",
      });
    } else if (hasOld && !hasNew) {
      changes.push({
        fieldName: key,
        fieldLabel: formatFieldLabel(key),
        oldValue: oldV,
        newValue: null,
        type: "removed",
      });
    } else if (!isSame) {
      changes.push({
        fieldName: key,
        fieldLabel: formatFieldLabel(key),
        oldValue: oldV,
        newValue: newV,
        type: "modified",
      });
    } else {
      changes.push({
        fieldName: key,
        fieldLabel: formatFieldLabel(key),
        oldValue: oldV,
        newValue: newV,
        type: "unchanged",
      });
    }
  });

  return changes;
}

export default function AuditTrailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const id = resolvedParams.id;

  const [showUnchanged, setShowUnchanged] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const { data: audit, isLoading, error } = useGetAuditTrailByIdQuery(id);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings/company/1" },
    { label: "Audit Trail", href: "/settings/audit-trail" },
    { label: `Event #${id}`, href: `/settings/audit-trail/${id}`, current: true },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] pb-20">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          <Skeleton className="h-6 w-64 bg-gray-200" />
          <Skeleton className="h-32 bg-white rounded-lg" />
          <Skeleton className="h-48 bg-white rounded-lg" />
          <Skeleton className="h-64 bg-white rounded-lg" />
        </main>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-[#F6F9FC] items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-2xs border border-gray-100 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#FCE8E6] text-[#C5221F] flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#32325D]">Record Not Found</h2>
          <p className="text-xs text-[#8898AA] mt-1 mb-6">
            Audit trail entry #{id} could not be retrieved. It may have been archived or removed.
          </p>
          <Link href="/settings/audit-trail">
            <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white w-full text-sm font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Activity Log
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = getActionBadgeConfig(audit.action);
  const actorName = formatActorDisplay(audit);
  const changes = computeFieldChanges(audit.old_values, audit.new_values);
  const activeChanges = changes.filter((c) => c.type !== "unchanged");
  const visibleChanges = showUnchanged ? changes : activeChanges;

  const metadataObj = toObject(audit.metadata);

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
                  {audit.description || `${badge.label} on ${audit.module || "System"}`}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#8898AA] mt-1">
                Activity record logged on {formatFriendlyDate(audit.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings/audit-trail">
              <Button
                variant="outline"
                className="border-gray-200 text-[#525F7F] hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Activity Log
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Summary Card */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
            Activity Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                Performed By
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-6 h-6 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs flex items-center justify-center">
                  {actorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[#32325D] font-semibold text-sm">
                  {actorName}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                Module / Section
              </span>
              <span className="text-[#32325D] font-semibold text-sm capitalize">
                {audit.module || "General"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                Date & Time
              </span>
              <span className="text-[#32325D] font-semibold text-sm">
                {formatFriendlyDate(audit.created_at)}
              </span>
            </div>

            <div>
              <span className="font-semibold text-[#8898AA] text-[11.5px] block mb-1">
                IP Address
              </span>
              <span className="text-[#32325D] font-mono text-sm">
                {audit.ip_address || "Internal"}
              </span>
            </div>
          </div>
        </div>

        {/* Changes Breakdown Card (Non-developer friendly diff table) */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-[#32325D]">
                Detailed Changes & Values
              </h2>
              <p className="text-xs text-[#8898AA] mt-0.5">
                {activeChanges.length > 0
                  ? `Comparing before and after values for this action (${activeChanges.length} modified field${activeChanges.length === 1 ? "" : "s"}).`
                  : "Summary of data recorded with this event."}
              </p>
            </div>

            {changes.length > activeChanges.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnchanged(!showUnchanged)}
                className="text-xs font-semibold text-[#1A73E8] hover:bg-blue-50"
              >
                {showUnchanged ? "Hide Unchanged Fields" : `Show All Fields (${changes.length})`}
              </Button>
            )}
          </div>

          {visibleChanges.length === 0 ? (
            <div className="py-8 text-center bg-[#F8FAFC] rounded-lg border border-dashed border-gray-200">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-[#525F7F]">No individual field changes recorded</p>
              <p className="text-[11px] text-[#8898AA] mt-0.5">
                This event represents a system state update without explicit field-level modifications.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-gray-100 text-[11.5px] font-semibold text-[#8898AA] uppercase tracking-wider">
                    <th className="py-3 px-4 w-1/4">Field / Property</th>
                    <th className="py-3 px-4 w-1/3">Previous Value (Before)</th>
                    <th className="py-3 px-4 w-1/3">New Value (After)</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {visibleChanges.map((change, idx) => (
                    <tr
                      key={idx}
                      className={
                        change.type === "added"
                          ? "bg-emerald-50/20"
                          : change.type === "removed"
                          ? "bg-rose-50/20"
                          : change.type === "modified"
                          ? "bg-blue-50/20"
                          : "hover:bg-gray-50/50"
                      }
                    >
                      {/* Field Name */}
                      <td className="py-3 px-4 font-semibold text-[#32325D]">
                        {change.fieldLabel}
                        <span className="block text-[10px] text-[#8898AA] font-mono mt-0.5 font-normal">
                          {change.fieldName}
                        </span>
                      </td>

                      {/* Old Value */}
                      <td className="py-3 px-4 text-[#525F7F]">
                        {change.type === "added" ? (
                          <span className="text-[#8898AA] italic">None (Newly Created)</span>
                        ) : (
                          <span
                            className={
                              change.type === "modified" || change.type === "removed"
                                ? "line-through text-[#C5221F] bg-red-50 px-1.5 py-0.5 rounded"
                                : ""
                            }
                          >
                            {formatFieldValue(change.oldValue)}
                          </span>
                        )}
                      </td>

                      {/* New Value */}
                      <td className="py-3 px-4 font-medium text-[#32325D]">
                        {change.type === "removed" ? (
                          <span className="text-[#C5221F] italic">Removed / Cleared</span>
                        ) : (
                          <span
                            className={
                              change.type === "added" || change.type === "modified"
                                ? "text-[#2BA24D] bg-emerald-50 px-1.5 py-0.5 rounded font-semibold"
                                : ""
                            }
                          >
                            {formatFieldValue(change.newValue)}
                          </span>
                        )}
                      </td>

                      {/* Change Status Badge */}
                      <td className="py-3 px-4 text-right">
                        {change.type === "added" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Added
                          </span>
                        )}
                        {change.type === "modified" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                            Changed
                          </span>
                        )}
                        {change.type === "removed" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                            Removed
                          </span>
                        )}
                        {change.type === "unchanged" && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
                            Unchanged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metadata Card (if present) */}
        {metadataObj && Object.keys(metadataObj).length > 0 && (
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
              Additional Context & Notes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metadataObj).map(([k, v]) => (
                <div key={k} className="p-3 bg-[#F8FAFC] rounded-lg border border-gray-100">
                  <span className="text-[11px] font-semibold text-[#8898AA] block mb-0.5">
                    {formatFieldLabel(k)}
                  </span>
                  <span className="text-xs font-semibold text-[#32325D]">
                    {formatFieldValue(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Technical Info (For advanced troubleshooting if ever needed) */}
        <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
          >
            <div>
              <span className="text-xs font-semibold text-[#525F7F]">
                System Technical Identifiers
              </span>
              <p className="text-[11px] text-[#8898AA]">
                Database references, Object IDs, and raw records
              </p>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-[#8898AA]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8898AA]" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="p-6 border-t border-gray-100 bg-[#F8FAFC] space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#8898AA] block">Record Log ID</span>
                  <span className="font-mono font-semibold text-[#32325D]">#{audit.id}</span>
                </div>
                <div>
                  <span className="text-[#8898AA] block">Target Object ID</span>
                  <span className="font-mono font-semibold text-[#32325D]">{audit.object_id || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[#8898AA] block">Content Type ID</span>
                  <span className="font-mono font-semibold text-[#32325D]">{audit.content_type || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[#8898AA] block">Tenant Organization</span>
                  <span className="font-mono font-semibold text-[#32325D]">{audit.tenant || "Default"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
