"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface InventoryFormTopBarProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  cancelHref: string;
}

export function InventoryFormTopBar({
  title,
  subtitle,
  icon,
  iconBgClass = "bg-[#E8F0FE] text-[#1A73E8]",
  cancelHref,
}: InventoryFormTopBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg shrink-0 ${iconBgClass}`}>{icon}</div>
        <div>
          <h1 className="text-xl font-semibold text-[#32325D]">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#8898AA] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <Link href={cancelHref}>
        <Button
          variant="outline"
          className="border-gray-200 text-[#525F7F] hover:bg-gray-50 text-sm h-9 px-3.5 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Cancel
        </Button>
      </Link>
    </div>
  );
}
