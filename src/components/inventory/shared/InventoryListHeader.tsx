"use client";

import React from "react";
import { Search, LayoutGrid, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface FilterTabItem {
  label: string;
  value: string;
}

export interface InventoryListHeaderProps {
  title: string;
  query: string;
  onQueryChange: (val: string) => void;
  searchPlaceholder?: string;
  actionButton?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  viewToggle?: {
    currentView: "list" | "grid";
    onViewChange: (view: "list" | "grid") => void;
  };
  filterTabs?: {
    tabs: FilterTabItem[];
    selectedTab: string;
    onTabChange: (val: string) => void;
  };
  extraActions?: React.ReactNode;
}

export function InventoryListHeader({
  title,
  query,
  onQueryChange,
  searchPlaceholder = "Search records...",
  actionButton,
  viewToggle,
  filterTabs,
  extraActions,
}: InventoryListHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
      {/* Top Bar: title + search + actions */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 w-full">
          <h1 className="text-xl font-semibold text-[#32325D] shrink-0">
            {title}
          </h1>
          <div className="relative flex-1 w-full max-w-md sm:ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#3B7CED] focus-visible:border-[#3B7CED] text-[#32325D] w-full"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              aria-label={`Search ${title}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end self-end sm:self-auto shrink-0">
          {extraActions}

          {actionButton &&
            (actionButton.href ? (
              <Link href={actionButton.href}>
                <Button className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all">
                  {actionButton.label}
                </Button>
              </Link>
            ) : (
              <Button
                onClick={actionButton.onClick}
                className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 px-4 rounded-md font-medium text-sm shadow-2xs transition-all"
              >
                {actionButton.label}
              </Button>
            ))}

          {viewToggle && (
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white gap-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => viewToggle.onViewChange("grid")}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  viewToggle.currentView === "grid"
                    ? "bg-blue-50 text-[#3B7CED]"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => viewToggle.onViewChange("list")}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                  viewToggle.currentView === "list"
                    ? "bg-blue-50 text-[#3B7CED]"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                title="List View"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      {filterTabs && filterTabs.tabs.length > 0 && (
        <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
          {filterTabs.tabs.map((tab) => {
            const isSelected = filterTabs.selectedTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => filterTabs.onTabChange(tab.value)}
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
      )}
    </div>
  );
}
