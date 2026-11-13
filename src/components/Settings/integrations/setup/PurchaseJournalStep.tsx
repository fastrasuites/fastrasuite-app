"use client";

import {
  getErrorDetail,
  getJournalId,
  getJournalLabel,
  useGetDefaultPurchaseJournalQuery,
  useGetJournalsQuery,
  useSetDefaultPurchaseJournalMutation,
  type OdooJournal,
} from "@/api/settings/integrationsApi";
import { useEffect, useMemo, useState } from "react";
import {
  Banner,
  Button,
  PageHeader,
  Select,
  Skeleton,
} from "../shared/primitives";

/** "Purchase journal" step: pick the Odoo journal for vendor bills. */
export function PurchaseJournalStep() {
  const journalsQuery = useGetJournalsQuery();
  const currentQuery = useGetDefaultPurchaseJournalQuery();
  const [setJournal, setJournalState] = useSetDefaultPurchaseJournalMutation();

  const [selected, setSelected] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /* GET /journals/default-purchase/ → { configured, default_purchase_journal } */
  const current = currentQuery.data?.default_purchase_journal ?? null;
  const options = useMemo(
    () =>
      (journalsQuery.data ?? [])
        /* The documented journal types are bank, cash, general, purchase, sale;
           vendor bills post to purchase journals. */
        .filter((j) => j.type === "purchase")
        .map((j) => ({
          value: String(getJournalId(j)),
          label: getJournalLabel(j),
        })),
    [journalsQuery.data],
  );

  useEffect(() => {
    if (selected === null && current)
      setSelected(String(getJournalId(current)));
  }, [current, selected]);

  const dirty =
    selected !== null &&
    String(getJournalId(current ?? ({} as OdooJournal))) !== selected;
  const currentLabel = getJournalLabel(current);

  const handleSave = async () => {
    if (selected === null) return;
    const res = await setJournal({ journalId: Number(selected) });
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not save the purchase journal. Please try again.",
      );
      return;
    }
    setActionError(null);
  };

  if (journalsQuery.isLoading || currentQuery.isLoading) {
    return (
      <div>
        <PageHeader
          title="Purchase journal"
          subtitle="The Odoo journal FastraSuite uses for vendor bills."
        />
        <Skeleton className="mt-6 h-16 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Purchase journal"
        subtitle="The Odoo journal FastraSuite uses for vendor bills."
        actions={
          <Button
            type="button"
            disabled={!dirty}
            loading={setJournalState.isLoading}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        }
      />

      {journalsQuery.isError ? (
        <Banner
          variant="error"
          title="We could not load Odoo journals"
          className="mt-4"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void journalsQuery.refetch()}
            >
              Try again
            </Button>
          }
        >
          Make sure you are connected to Odoo, then retry.
        </Banner>
      ) : actionError ? (
        <Banner variant="error" title="Something went wrong" className="mt-4">
          {actionError}
        </Banner>
      ) : null}

      <div className="mt-6 max-w-xl">
        <p className="mb-1.5 text-sm font-semibold text-gray-900">
          Odoo purchase journal
        </p>
        <Select
          placeholder="Select journal"
          value={selected}
          onChange={setSelected}
          options={options}
          loading={journalsQuery.isFetching && options.length === 0}
        />
        {options.length === 0 && !journalsQuery.isError ? (
          <p className="mt-2 text-sm text-gray-500">
            No purchase journals were returned by Odoo yet.
          </p>
        ) : null}
      </div>

      {!dirty && current ? (
        <Banner variant="success" title="Saved selection" className="mt-6">
          {currentLabel} is used for all vendor bills sent to Odoo.
        </Banner>
      ) : null}
    </div>
  );
}
