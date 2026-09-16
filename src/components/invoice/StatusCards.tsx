"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ApprovedIcon, PenddingIcon, RejectedIcon } from "../shared/icons";
import { InvoiceRow } from "./types";

export function StatusCards({ rows }: { rows: InvoiceRow[] }) {
  const router = useRouter();

  const counts = useMemo(() => {
    return {
      paid: rows.filter((r) => r.status === "paid").length,
      partial: rows.filter((r) => r.status === "partial").length,
      unpaid: rows.filter((r) => r.status === "unpaid").length,
    };
  }, [rows]);

  const handleCardClick = (status: string) => {
    router.push(`/invoice/status?status=${status}`);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {card(
          "Paid",
          counts.paid,
          <ApprovedIcon color="#2BA24D" />,
          "text-[#2BA24D]",
          "border-r border-l-transparent border-y-transparent",
          "paid"
        )}
        {card(
          "Partially Paid",
          counts.partial,
          <PenddingIcon color="#F0B401" />,
          "text-[#F0B401]",
          "border-r border-l-transparent border-y-transparent",
          "partial"
        )}
        {card(
          "Unpaid",
          counts.unpaid,
          <RejectedIcon color="#E43D2B" />,
          "text-[#E43D2B]",
          "border-transparent",
          "unpaid"
        )}
      </div>
    </section>
  );
}
