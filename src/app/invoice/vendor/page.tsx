"use client";

import React from "react";
import { VendorTab } from "@/components/invoice/settings/VendorTab";
import { PageGuard } from "@/components/auth/PageGuard";

export default function VendorListPage() {
  return (
    <PageGuard module="invoice" entitlement="configure_invoice">
      <div className="p-6 space-y-6">
        <VendorTab />
      </div>
    </PageGuard>
  );
}
