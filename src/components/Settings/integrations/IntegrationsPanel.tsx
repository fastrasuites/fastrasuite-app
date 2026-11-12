"use client";

import { Fragment, useState } from "react";
import { VendorBillsScreen } from "./bills/VendorBillsScreen";
import { PaymentsScreen } from "./payments/PaymentsScreen";
import { cn } from "./shared/utils";
import { SetupScreen } from "./setup/SetupScreen";
import { useSetupStatus } from "./setup/useSetupStatus";

export type IntegrationsTab = "setup" | "bills" | "payments";

const TABS: { id: IntegrationsTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "bills", label: "Vendor Bills" },
  { id: "payments", label: "Payments" },
];

/**
 * Root of the Integrations screen (accounting software / Odoo):
 * the Setup | Vendor Bills | Payments tabs and their content.
 *
 * NavBar, breadcrumbs and the app sidebar are handled by the settings
 * layout – this component only renders the tabbed content area.
 */
export function IntegrationsPanel() {
  const [tab, setTab] = useState<IntegrationsTab>("setup");
  const { attentionSteps } = useSetupStatus();
  /** Red badge on the Setup tab = number of incomplete setup steps. */
  const setupBadge = attentionSteps.length;

  return (
    <div className="flex min-h-[720px] flex-col bg-white">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Integration sections"
        className="flex items-center gap-6 border-b border-gray-200 px-6"
      >
        {TABS.map((t, index) => {
          const active = tab === t.id;
          return (
            <Fragment key={t.id}>
              {index === 1 ? (
                <span className="h-5 w-px bg-gray-200" aria-hidden />
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 pb-3 pt-4 text-sm transition-colors",
                  active
                    ? "border-blue-600 font-medium text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900",
                )}
              >
                {t.label}
                {t.id === "setup" && setupBadge > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {setupBadge}
                  </span>
                ) : null}
              </button>
            </Fragment>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1">
        {tab === "setup" && <SetupScreen />}
        {/* {tab === "bills" && (
          <VendorBillsScreen onReviewSetup={() => setTab("setup")} />
        )}
        {tab === "payments" && (
          <PaymentsScreen onReviewSetup={() => setTab("setup")} />
        )} */}
      </div>
    </div>
  );
}
