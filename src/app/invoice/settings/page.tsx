"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CompanyBankAccountsTab } from "@/components/invoice/settings/CompanyBankAccountsTab";
import { AccountingSettingsTab } from "@/components/invoice/settings/AccountingSettingsTab";
import { CurrenciesTab } from "@/components/invoice/settings/CurrenciesTab";
import { PaymentTermsTab } from "@/components/invoice/settings/PaymentTermsTab";
import { RequestAccountMappingsTab } from "@/components/invoice/settings/RequestAccountMappingsTab";
import { VendorTab } from "@/components/invoice/settings/VendorTab";
import { PageGuard } from "@/components/auth/PageGuard";

type Tab =
  | "accounting"
  | "bank-accounts"
  | "request-mappings"
  | "currencies"
  | "payment-terms"
  | "vendor";

const VALID_TABS: Tab[] = [
  "accounting",
  "bank-accounts",
  "request-mappings",
  "currencies",
  "payment-terms",
  "vendor",
];

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Tab | null;

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    return "accounting";
  });

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/invoice/settings?tab=${tab}`, { scroll: false });
  };

  return (
    <PageGuard module="invoice" entitlement="configure_invoice">
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span className="text-gray-400">›</span>
          <span>Invoice</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-medium">Settings</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your invoicing preferences, accounting defaults, and bank
            accounts.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("accounting")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "accounting"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Accounting Settings
            </button>
            <button
              onClick={() => handleTabChange("bank-accounts")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "bank-accounts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Company Bank Accounts
            </button>
            <button
              onClick={() => handleTabChange("request-mappings")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "request-mappings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Account Mapping
            </button>
            <button
              onClick={() => handleTabChange("currencies")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "currencies"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Currencies
            </button>
            <button
              onClick={() => handleTabChange("payment-terms")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "payment-terms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Payment Terms
            </button>
            <button
              onClick={() => handleTabChange("vendor")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "vendor"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Vendor
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "accounting" && <AccountingSettingsTab />}
          {activeTab === "bank-accounts" && <CompanyBankAccountsTab />}
          {activeTab === "request-mappings" && <RequestAccountMappingsTab />}
          {activeTab === "currencies" && <CurrenciesTab />}
          {activeTab === "payment-terms" && <PaymentTermsTab />}
          {activeTab === "vendor" && <VendorTab />}
        </div>
      </div>
    </PageGuard>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading settings...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}

