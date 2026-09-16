"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPermissions,
  MODULE_PERMISSIONS_MAPPING,
  ALL_PERMISSION_TYPES,
  ModulePermissions,
} from "@/utils/modulePermissionsStore";
import { MODULE_PERMISSION_DESCRIPTIONS } from "@/utils/modulePermissionDescriptions";
import { ChevronDown, ChevronRight, CheckCircle2, ShieldCheck, Info } from "lucide-react";

interface PermissionsGridProps {
  permissions: UserPermissions;
  onChange?: (permissions: UserPermissions) => void;
  readOnly?: boolean;
}

export default function PermissionsGrid({
  permissions,
  onChange,
  readOnly = false,
}: PermissionsGridProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const toggleAll = () => {
    const allModuleKeys = Object.keys(MODULE_PERMISSIONS_MAPPING);
    const areAllExpanded = allModuleKeys.every((key) => expandedModules[key]);
    
    if (areAllExpanded) {
      setExpandedModules({});
    } else {
      const nextState: Record<string, boolean> = {};
      allModuleKeys.forEach((key) => {
        nextState[key] = true;
      });
      setExpandedModules(nextState);
    }
  };

  const handleCheckboxChange = (
    moduleKey: keyof UserPermissions,
    permissionKey: string,
    checked: boolean,
  ) => {
    if (readOnly || !onChange) return;

    const updatedPermissions = { ...permissions };
    const updatedModule = { ...updatedPermissions[moduleKey] } as Record<
      string,
      boolean
    >;

    if (checked) {
      updatedModule[permissionKey] = true;
    } else {
      delete updatedModule[permissionKey];
    }

    updatedPermissions[moduleKey] = updatedModule as ModulePermissions;
    onChange(updatedPermissions);
  };

  const allModuleKeys = Object.keys(MODULE_PERMISSIONS_MAPPING);
  const areAllExpanded = allModuleKeys.length > 0 && allModuleKeys.every((key) => expandedModules[key]);

  return (
    <div className="w-full space-y-2">
      {/* Control bar / Expand All Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5 text-[#3B7CED]" />
          <span>Click any module row to expand its permission capabilities and entitlement breakdown.</span>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-semibold text-[#3B7CED] hover:text-[#2d62bd] transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-blue-50"
        >
          {areAllExpanded ? "Collapse All Details" : "Expand All Details"}
        </button>
      </div>

      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-left bg-white min-w-200">
          <thead>
            <tr className="bg-[#F1F2F4] border-b border-gray-200">
              <th className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider w-[26%]">
                Module
              </th>
              {ALL_PERMISSION_TYPES.map((type) => (
                <th
                  key={type.key}
                  className="p-4 font-semibold text-[#7A8A98] text-sm uppercase tracking-wider text-center"
                >
                  {type.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(MODULE_PERMISSIONS_MAPPING).map(
              ([moduleKey, moduleMeta]) => {
                const currentModuleKey = moduleKey as keyof UserPermissions;
                const isExpanded = !!expandedModules[moduleKey];
                const metaDescription = MODULE_PERMISSION_DESCRIPTIONS[moduleKey];

                return (
                  <React.Fragment key={moduleKey}>
                    {/* Main Row */}
                    <tr
                      className={`transition-colors ${
                        isExpanded ? "bg-blue-50/20" : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Module Label with Expand Chevron */}
                      <td className="p-4 font-medium text-[#1A1A1A] text-sm align-middle">
                        <button
                          type="button"
                          onClick={() => toggleModule(moduleKey)}
                          className="flex items-center gap-2 text-left w-full group cursor-pointer focus:outline-hidden"
                        >
                          <span className="p-1 rounded-md text-gray-400 group-hover:text-[#3B7CED] group-hover:bg-blue-50 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[#3B7CED]" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-[#3B7CED] transition-colors">
                              {moduleMeta.label}
                            </span>
                            <p className="text-xs text-gray-400 font-normal line-clamp-1">
                              {metaDescription?.description || "Configure access permissions"}
                            </p>
                          </div>
                        </button>
                      </td>

                      {/* Permission Type Columns */}
                      {ALL_PERMISSION_TYPES.map((type) => {
                        const isAllowed = moduleMeta.allowed.includes(type.key);
                        const isChecked =
                          !!permissions[currentModuleKey]?.[
                            type.key as keyof ModulePermissions
                          ];

                        return (
                          <td
                            key={type.key}
                            className={`p-4 text-center align-middle ${
                              !isAllowed ? "bg-gray-100/40 cursor-not-allowed" : ""
                            }`}
                          >
                            {isAllowed ? (
                              <div className="flex justify-center items-center h-full">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(
                                      currentModuleKey,
                                      type.key,
                                      !!checked,
                                    )
                                  }
                                  disabled={readOnly}
                                  className={`size-4 transition-all duration-200 font-bold 
               ring-1 ring-gray-300 hover:ring-gray-400 
               data-[state=checked]:bg-[#3B7CED] data-[state=checked]:border-[#3B7CED] data-[state=checked]:text-white
               ${!readOnly ? "hover:scale-110 active:scale-95" : ""}`}
                                />
                              </div>
                            ) : (
                              <div className="flex justify-center items-center h-full text-gray-300 select-none">
                                <span className="text-xs font-semibold text-gray-300/40">
                                  —
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expandable Detail Drawer */}
                    {isExpanded && metaDescription && (
                      <tr className="bg-[#F8FAFC] border-y border-blue-100 animate-in fade-in-50 duration-150">
                        <td
                          colSpan={ALL_PERMISSION_TYPES.length + 1}
                          className="p-5"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-gray-200/70">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#3B7CED]" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                  {metaDescription.label} — Role & Entitlements Breakdown
                                </h4>
                              </div>
                              <span className="text-xs text-gray-400">
                                {readOnly ? "View-only mode" : "Click a card to toggle that role"}
                              </span>
                            </div>

                            {/* Cards Grid for Allowed Permission Types */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {moduleMeta.allowed.map((typeKey) => {
                                const typeMeta = metaDescription.permissionTypes[typeKey];
                                if (!typeMeta) return null;

                                const isChecked =
                                  !!permissions[currentModuleKey]?.[
                                    typeKey as keyof ModulePermissions
                                  ];

                                return (
                                  <div
                                    key={typeKey}
                                    onClick={() => {
                                      if (!readOnly) {
                                        handleCheckboxChange(
                                          currentModuleKey,
                                          typeKey,
                                          !isChecked,
                                        );
                                      }
                                    }}
                                    className={`p-3.5 rounded-lg border transition-all duration-150 flex flex-col justify-between ${
                                      !readOnly ? "cursor-pointer" : ""
                                    } ${
                                      isChecked
                                        ? "bg-white border-[#3B7CED] shadow-xs ring-1 ring-[#3B7CED]/20"
                                        : "bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white"
                                    }`}
                                  >
                                    <div>
                                      {/* Header */}
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                          {typeMeta.label}
                                        </span>
                                        {isChecked ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B7CED] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Active
                                          </span>
                                        ) : (
                                          <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            Disabled
                                          </span>
                                        )}
                                      </div>

                                      {/* Summary */}
                                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                        {typeMeta.summary}
                                      </p>

                                      {/* Entitlements list */}
                                      <div className="pt-2 border-t border-gray-100">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                                          Entitlements Granted:
                                        </p>
                                        <ul className="space-y-1">
                                          {typeMeta.entitlements.map((ent, idx) => (
                                            <li
                                              key={idx}
                                              className="text-xs text-gray-600 flex items-start gap-1.5 leading-snug"
                                            >
                                              <span className="text-[#3B7CED] font-bold mt-0.5">•</span>
                                              <span>{ent}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

