"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Status, RequestRow } from "../types";
import {
  ApprovedIcon,
  DraftIcon,
  PenddingIcon,
  RejectedIcon,
} from "../../shared/icons";

export function StatusCards({ rows }: { rows: RequestRow[] }) {
  const router = useRouter();

  const counts = useMemo(() => {
    return {
      draft: rows.filter((r) => r.status === "draft").length,
      approved: rows.filter((r) => r.status === "approved").length,
      pending: rows.filter((r) => r.status === "pending").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  const handleCardClick = (status: string) => {
    router.push(`/purchase/purchase_requests/status?status=${status}`);
  };

  const card = (
    label: string,
    value: number,
    icon: React.ReactNode,
    colorClass = "text-gray-700",
    borderClass = "border-transparent",
    status?: string
  ) => (
    <Card
      className={`${borderClass} p-4 shadow-none rounded-none cursor-pointer hover:bg-gray-50 transition-colors`}
      onClick={() => status && handleCardClick(status)}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-lg">{icon}</div>
          <div className={`text-sm font-medium ${colorClass}`}>{label}</div>
        </div>
        <div className={`text-[2rem] font-bold ${colorClass}`}>{value}</div>
      </div>
    </Card>
  );

  return (
    <section className="max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {card(
          "Draft",
          counts.draft,
          <DraftIcon color="#3B7CED" />,
          "text-[#3B7CED]",
          "border-r border-l-transparent border-y-transparent",
          "draft"
        )}
        {card(
          "Approved",
          counts.approved,
          <ApprovedIcon color="#2BA24D" />,
          "text-[#2BA24D]",
          "border-r border-l-transparent border-y-transparent",
          "approved"
        )}
        {card(
          "Pending",
          counts.pending,
          <PenddingIcon color="#F0B401" />,
          "text-[#F0B401]",
          "border-r border-l-transparent border-y-transparent",
          "pending"
        )}
        {card(
          "Rejected",
          counts.rejected,
          <RejectedIcon color="#E43D2B" />,
          "text-[#E43D2B]",
          "border-transparent",
          "rejected"
        )}
      </div>
    </section>
  );
}
