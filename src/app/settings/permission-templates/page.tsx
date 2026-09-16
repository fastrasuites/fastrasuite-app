"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import {
  PermissionTemplate,
  UserPermissions,
  createEmptyPermissions,
  convertApiItemsToPermissions,
} from "@/utils/modulePermissionsStore";
import { ClipboardList, Trash2, Archive, Shield, CheckCircle } from "lucide-react";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";
import {
  useGetPermissionTemplatesQuery,
  useActivatePermissionTemplateMutation,
  useArchivePermissionTemplateMutation,
} from "@/api/settings/permissionsTemplateApi";
import type { PermissionTemplate as ApiPermissionTemplate } from "@/api/settings/permissionsTemplateApi";

export default function PermissionTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  const viewMode = useSelector((state: RootState) => state.viewMode.mode);
  const archiveFlag = useSelector((state: RootState) => state.viewMode.archive);

  const { data: apiTemplates = [], isLoading, refetch } = useGetPermissionTemplatesQuery(
    searchQuery ? { search: searchQuery } : undefined
  );

  const [activateTemplate] = useActivatePermissionTemplateMutation();
  const [archiveTemplate] = useArchivePermissionTemplateMutation();
  const statusModal = useStatusModal();

  const templates: PermissionTemplate[] = useMemo(() => {
    return apiTemplates.map((t: ApiPermissionTemplate) => ({
      id: String(t.id),
      name: t.name,
      permissions: convertApiItemsToPermissions(t.items),
      isArchived: !t.is_active,
      createdAt: t.created_at || new Date().toISOString(),
    }));
  }, [apiTemplates]);

  const formattedTemplates = useMemo(() => {
    return templates.map((t) => {
      let enabledCount = 0;
      Object.values(t.permissions).forEach((modulePerms) => {
        Object.values(modulePerms).forEach((val) => {
          if (val) enabledCount++;
        });
      });

      return {
        ...t,
        enabledCount,
      };
    });
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = formattedTemplates;

    result = result.filter((t) => (archiveFlag ? t.isArchived : !t.isArchived));

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(lower));
    }

    return result;
  }, [formattedTemplates, archiveFlag, searchQuery]);

  const handleArchiveToggle = async (template: PermissionTemplate) => {
    try {
      if (template.isArchived) {
        await activateTemplate({ id: Number(template.id) }).unwrap();
        statusModal.showSuccess(
          "Success",
          `Template "${template.name}" has been activated successfully!`
        );
      } else {
        await archiveTemplate({ id: Number(template.id) }).unwrap();
        statusModal.showSuccess(
          "Success",
          `Template "${template.name}" has been archived successfully!`
        );
      }
      refetch();
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", `Failed to ${template.isArchived ? "activate" : "archive"} template.`);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/settings/permission-templates/${id}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-6 w-full max-w-[1400px] mx-auto">
      {filteredTemplates.length === 0 ? (
        <div className="py-20 w-full flex flex-col items-center justify-center text-center bg-white rounded-lg border border-gray-150">
          <Shield className="w-16 h-16 text-gray-300 mb-4 stroke-[1.5]" />
          <p className="text-gray-500 text-lg font-medium">No permission templates found</p>
          <p className="text-gray-400 text-sm mt-1">
            {archiveFlag ? "There are no archived templates." : "Try creating a new permission template to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              onClick={() => handleEdit(t.id)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#E8EFFD] flex items-center justify-center text-[#3B7CED] group-hover:bg-[#3B7CED] group-hover:text-white transition-colors duration-200">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.isArchived
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-green-50 text-green-600 border border-green-200"
                    }`}
                  >
                    {t.isArchived ? "Archived" : "Active"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#3B7CED] transition-colors">
                  {t.name}
                </h3>
                <div className="flex gap-2 items-center text-sm text-gray-500 mb-4">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{t.enabledCount} enabled rules</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-400">
                <span>Created: {formatDate(t.createdAt)}</span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleArchiveToggle(t)}
                    title={t.isArchived ? "Activate" : "Archive"}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F2F4] border-b border-gray-200">
                <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider pl-6">
                  Template Name
                </th>
                <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider">
                  Active Permissions
                </th>
                <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider">
                  Date Created
                </th>
                <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider text-right pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTemplates.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => handleEdit(t.id)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="p-4 pl-6 font-medium text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#E8EFFD] flex items-center justify-center text-[#3B7CED]">
                      <Shield className="w-4 h-4" />
                    </div>
                    {t.name}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    <span className="font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">
                      {t.enabledCount} active rules
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        t.isArchived
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-green-50 text-green-600 border border-green-200"
                      }`}
                    >
                      {t.isArchived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => handleArchiveToggle(t)}
                        title={t.isArchived ? "Activate" : "Archive"}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}
