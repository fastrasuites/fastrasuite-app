"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { InventoryStatusBadge } from "./InventoryStatusBadge";

export interface InventoryDetailTopBarProps {
  title: string;
  id: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  status?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  showPrintButton?: boolean;
}

export function InventoryDetailTopBar({
  title,
  id,
  icon,
  iconBgClass = "bg-[#E8F0FE] text-[#1A73E8]",
  status,
  subtitle,
  actions,
  showPrintButton = true,
}: InventoryDetailTopBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg shrink-0 ${iconBgClass}`}>{icon}</div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-[#32325D]">
              {title}: {id}
            </h1>
            {status && <InventoryStatusBadge status={status} />}
          </div>
          {subtitle && (
            <div className="text-xs text-[#8898AA] mt-1">{subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 flex-wrap">
        {actions}
        {showPrintButton && (
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-gray-200 text-[#32325D] hover:bg-gray-50 h-9 px-4 rounded-md font-medium text-sm transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print Voucher
          </Button>
        )}
      </div>
    </div>
  );
}
