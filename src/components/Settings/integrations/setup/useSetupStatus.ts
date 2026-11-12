"use client";

import {
  getConnectionStatus,
  getMappingStatus,
  useGetAccountMappingsQuery,
  useGetConnectionQuery,
  useGetDefaultPurchaseJournalQuery,
  useGetVendorMappingsQuery,
} from "@/api/settings/integrationsApi";
import { useMemo } from "react";
import { SETUP_STEP_LABELS, SETUP_STEP_ORDER, type SetupStepId } from "./steps";

export interface StepState {
  /** Step is fully configured – shows a green check in the left menu. */
  done: boolean;
  /** Step is incomplete but reachable – shows a red dot in the left menu */
  /** and increments the Setup tab badge.                                 */
  attention: boolean;
}

export interface SetupStatus {
  steps: Record<SetupStepId, StepState>;
  /** Incomplete-but-reachable steps, in wizard order. */
  attentionSteps: SetupStepId[];
  /** Human labels for the attention steps ("Vendor Mapping", ...). */
  attentionLabels: string[];
  isLoading: boolean;
}

/**
 * Derives the per-step completion state for the Setup wizard from the
 * integration API. Tax and currency mapping are marked TODO(backend):
 * the swagger (12 Nov 2026) has no tax/currency endpoints, so they
 * always report done=false until their endpoints are wired.
 */
export function useSetupStatus(): SetupStatus {
  const connectionQuery = useGetConnectionQuery();
  const vendorMappingsQuery = useGetVendorMappingsQuery();
  const accountMappingsQuery = useGetAccountMappingsQuery();
  const purchaseJournalQuery = useGetDefaultPurchaseJournalQuery();

  const steps = useMemo<Record<SetupStepId, StepState>>(() => {
    /* GET /connection/ returns 200 with configured=false when the
     * integration has never been set up. */
    const connection = connectionQuery.data?.configured
      ? connectionQuery.data
      : null;

    const connectionDone = getConnectionStatus(connection) === "connected";
    const companyDone = connection?.selected_company_id != null;

    const allConfirmed = (rows?: { status?: string }[] | null) =>
      !!rows && rows.length > 0 && rows.every((m) => getMappingStatus(m) === "confirmed");

    const vendorsDone = allConfirmed(vendorMappingsQuery.data);
    const accountsDone = allConfirmed(accountMappingsQuery.data);
    const journalDone =
      purchaseJournalQuery.data?.configured === true &&
      purchaseJournalQuery.data?.default_purchase_journal != null;

    // TODO(backend): flip these once tax/currency endpoints exist.
    const taxDone = false;
    const currencyDone = false;

    const done: Record<SetupStepId, boolean> = {
      odoo_connection: connectionDone,
      company_selection: companyDone,
      vendor_mapping: vendorsDone,
      chart_of_accounts: accountsDone,
      purchase_journal: journalDone,
      tax_mapping: taxDone,
      currency_mapping: currencyDone,
    };

    const attention: Record<SetupStepId, boolean> = {
      odoo_connection: !connectionDone,
      company_selection: connectionDone && !companyDone,
      vendor_mapping: companyDone && !vendorsDone,
      chart_of_accounts: companyDone && !accountsDone,
      purchase_journal: vendorsDone && accountsDone && !journalDone,
      tax_mapping: vendorsDone && accountsDone && journalDone && !taxDone,
      currency_mapping: vendorsDone && accountsDone && journalDone && !currencyDone,
    };

    return SETUP_STEP_ORDER.reduce(
      (acc, id) => {
        acc[id] = { done: done[id], attention: attention[id] };
        return acc;
      },
      {} as Record<SetupStepId, StepState>,
    );
  }, [connectionQuery.data, vendorMappingsQuery.data, accountMappingsQuery.data, purchaseJournalQuery.data]);

  const attentionSteps = useMemo(
    () => SETUP_STEP_ORDER.filter((id) => steps[id].attention),
    [steps],
  );

  return {
    steps,
    attentionSteps,
    attentionLabels: attentionSteps.map((id) => SETUP_STEP_LABELS[id]),
    isLoading:
      connectionQuery.isLoading ||
      vendorMappingsQuery.isLoading ||
      accountMappingsQuery.isLoading ||
      purchaseJournalQuery.isLoading,
  };
}
