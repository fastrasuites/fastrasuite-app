"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "../shared/primitives";
import { cn } from "../shared/utils";
import { ChartOfAccountsStep } from "./ChartOfAccountsStep";
import { CompanySelectionStep } from "./CompanySelectionStep";
import { CurrencyMappingStep } from "./CurrencyMappingStep";
import { OdooConnectionStep } from "./OdooConnectionStep";
import { PurchaseJournalStep } from "./PurchaseJournalStep";
import { TaxMappingStep } from "./TaxMappingStep";
import { VendorMappingStep } from "./VendorMappingStep";
import {
  SETUP_STEP_GROUPS,
  SETUP_STEP_LABELS,
  SETUP_STEP_ORDER,
  type SetupStepId,
} from "./steps";
import { useSetupStatus } from "./useSetupStatus";

/**
 * Body of the "Setup" tab: left wizard menu
 * (CONNECTION / MAPPINGS / CONFIGURATION) + active step screen +
 * back/next footer, matching the Accounting Integration prototype.
 */
export function SetupScreen() {
  const [activeStep, setActiveStep] = useState<SetupStepId>("odoo_connection");
  const { steps } = useSetupStatus();

  const currentIndex = SETUP_STEP_ORDER.indexOf(activeStep);
  const prevStep = currentIndex > 0 ? SETUP_STEP_ORDER[currentIndex - 1] : null;
  const nextStep =
    currentIndex < SETUP_STEP_ORDER.length - 1
      ? SETUP_STEP_ORDER[currentIndex + 1]
      : null;

  return (
    <div className="flex min-h-[640px]">
      {/* Left wizard menu */}
      <aside className="w-[230px] shrink-0 border-r border-gray-100 px-3 py-6">
        {SETUP_STEP_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              {group.label}
            </p>
            {group.steps.map((id) => {
              const state = steps[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveStep(id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded border-l-[3px] px-3 py-2 text-sm transition-colors",
                    activeStep === id
                      ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                      : "border-transparent text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span>{SETUP_STEP_LABELS[id]}</span>
                  {state.done ? (
                    <Check
                      className="h-4 w-4 shrink-0 text-green-600"
                      aria-label="Completed"
                    />
                  ) : state.attention ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                      aria-label="Needs attention"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Step content + footer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 px-8 py-6">
          {activeStep === "odoo_connection" && (
            <OdooConnectionStep onNavigate={setActiveStep} />
          )}
          {activeStep === "company_selection" && (
            <CompanySelectionStep onNavigate={setActiveStep} />
          )}
          {activeStep === "vendor_mapping" && <VendorMappingStep />}
          {activeStep === "chart_of_accounts" && <ChartOfAccountsStep />}
          {activeStep === "purchase_journal" && <PurchaseJournalStep />}
          {activeStep === "tax_mapping" && <TaxMappingStep />}
          {activeStep === "currency_mapping" && <CurrencyMappingStep />}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-8 py-4">
          {prevStep ? (
            <button
              type="button"
              onClick={() => setActiveStep(prevStep)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {SETUP_STEP_LABELS[prevStep]}
            </button>
          ) : (
            <span />
          )}
          {nextStep ? (
            <Button type="button" onClick={() => setActiveStep(nextStep)}>
              Next: {SETUP_STEP_LABELS[nextStep]}
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
