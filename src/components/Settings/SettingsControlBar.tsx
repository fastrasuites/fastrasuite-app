"use client";

import React, { useState } from "react";
import { GrayButton } from "@/components/ui/grayButton";
import { cn } from "@/lib/utils";
import { GridViewIcon } from "../icons/GridIcon";
import { ListViewIcon } from "../icons/ListViewIcon";
import { RootState } from "@/lib/store/store";
import { setViewMode } from "./viewModeSlice";
import { useDispatch, useSelector } from "react-redux";
import { PermissionGuard } from "../ProtectedComponent";

type SettingsControlBarProps = {
  activeSection:
    | "company"
    | "user"
    | "accessgroup"
    | "application"
    | "permissiontemplates"
    | "multilocation"
    | "audittrail"
    | "billing";
  onSearch?: (query: string) => void;
  onNew?: () => void;
  onShowArchivedUsers?: () => void; // NEW HANDLER
  initialView?: "grid" | "list";
  className?: string;
};

export const SettingsControlBar = ({
  activeSection,
  onSearch,
  onNew,
  onShowArchivedUsers,
  initialView = "grid",
  className,
}: SettingsControlBarProps) => {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const viewMode = useSelector((state: RootState) => state.viewMode.mode);
  const archive = useSelector((state: RootState) => state.viewMode.archive);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleToggleView = (mode: "grid" | "list") => {
    dispatch(setViewMode(mode));
  };
  const getButtonLabel = () => {
    switch (activeSection) {
      case "company":
        return "Update Company";
      case "user":
        return "Create User";
      case "accessgroup":
        return "New Access Group";
      case "application":
        return "New Application";
      case "permissiontemplates":
        return "New Template";
      default:
        return "New Item";
    }
  };

  const sectionToAddEntitlement: Record<
    | "company"
    | "user"
    | "accessgroup"
    | "application"
    | "permissiontemplates"
    | "multilocation"
    | "audittrail"
    | "billing",
    string
  > = {
    company: "change_company",
    user: "add_tenantuser",
    permissiontemplates: "add_permissiontemplate",
    multilocation: "change_location",
    accessgroup: "add_permissiontemplate",
    application: "change_company",
    audittrail: "view_company",
    billing: "view_company",
  };

  return (
    <div
      className={cn(
        "w-full flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 border-b border-gray-200",
        className,
      )}
    >
      {/* Left: Search */}
      <div className="flex gap-4 min-w-[40%]">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={`Search ${activeSection}...`}
          className="w-full flex-1 px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-[#3B7CED]"
        />
      </div>

      {/* Right Controls */}
      <div className="flex gap-3 items-center">
        {/* Primary Button */}
        <PermissionGuard
          module="settings"
          entitlement={sectionToAddEntitlement[activeSection]}
        >
          <GrayButton
            size="md"
            className="bg-[#3B7CED] text-white"
            onClick={onNew}
          >
            {getButtonLabel()}
          </GrayButton>
        </PermissionGuard>

        {/* Secondary Button (ONLY on Users and Permission Templates Page) */}
        {(activeSection === "user" ||
          activeSection === "permissiontemplates") &&
          onShowArchivedUsers && (
            <GrayButton
              size="md"
              className={
                archive
                  ? "bg-[#3B7CED] text-white"
                  : "bg-white border border-[#3B7CED] text-[#3B7CED]"
              }
              onClick={onShowArchivedUsers}
            >
              {activeSection === "user"
                ? "Archived Users"
                : archive
                  ? "Active Templates"
                  : "Archived Templates"}
            </GrayButton>
          )}

        {/* Grid/List Toggle */}
        <div className="flex items-center border border-[#E2E6E9] rounded-sm px-2 h-11">
          <button
            type="button"
            aria-label="Grid view"
            className="p-1 hover:bg-gray-100"
            onClick={() => handleToggleView("grid")}
          >
            <GridViewIcon
              className="w-5 h-5"
              fill={viewMode === "grid" ? "#3B7CED" : "#A9B3BC"}
            />
          </button>

          <div className="w-px self-stretch bg-[#E2E6E9] mx-1" />

          <button
            type="button"
            aria-label="List view"
            className="p-1 hover:bg-gray-100"
            onClick={() => handleToggleView("list")}
          >
            <ListViewIcon
              className="w-5 h-5"
              fill={viewMode === "list" ? "#3B7CED" : "#A9B3BC"}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
