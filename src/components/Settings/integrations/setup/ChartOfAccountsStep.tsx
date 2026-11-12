"use client";

import {
  getErrorDetail,
  getLocalAccountLabel,
  getLocalAccountType,
  getMappingId,
  getMappingStatus,
  getOdooAccountId,
  getOdooAccountName,
  useConfirmAccountMappingMutation,
  useGetAccountsQuery,
  useGetAccountMappingsQuery,
  useSuggestAccountMappingsMutation,
  type AccountMapping,
  type MappingSuggestSummary,
  type OdooAccount,
} from "@/api/settings/integrationsApi";
import { Fragment, useMemo, useState } from "react";
import {
  Banner,
  Button,
  FilterPill,
  PageHeader,
  Pill,
  SearchInput,
  Select,
  Skeleton,
} from "../shared/primitives";

type AccountFilter = "all" | "attention" | "complete";

const accountLabel = (a: OdooAccount) =>
  [a.code, a.name].filter(Boolean).join(" ") || a.name || `#${a.id}`;

/**
 * Groups the mapping table by the FastrSuite account type, e.g.
 * "expense_and_cost" → "Expense and cost accounts".
 */
const accountGroupLabel = (type: string): string => {
  const words = type.replace(/[_-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Other accounts";
  const label = words
    .map((w) => (w.toLowerCase() === "and" ? "and" : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
  return /accounts?$/i.test(label) ? label : `${label} accounts`;
};

/** "Chart of accounts mapping" step: match FastrSuite accounts to Odoo accounts. */
export function ChartOfAccountsStep() {
  const mappingsQuery = useGetAccountMappingsQuery();
  const accountsQuery = useGetAccountsQuery();
  const [suggest, suggestState] = useSuggestAccountMappingsMutation();
  const [confirm, confirmState] = useConfirmAccountMappingMutation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AccountFilter>("all");
  /** Rows changed but not saved yet (mappingId -> odoo account id). */
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Counters from the latest successful POST /account-mappings/suggest/. */
  const [suggestSummary, setSuggestSummary] = useState<MappingSuggestSummary | null>(null);

  const rows = useMemo(() => mappingsQuery.data ?? [], [mappingsQuery.data]);
  const accountOptions = (accountsQuery.data ?? []).map((a) => ({
    value: String(a.id),
    label: accountLabel(a),
  }));

  const completeCount = rows.filter((m) => getMappingStatus(m) === "confirmed").length;
  const attentionCount = rows.length - completeCount;
  const dirtyCount = Object.keys(dirty).length;

  const filtered = rows.filter((m) => {
    const status = getMappingStatus(m);
    if (filter === "complete" && status !== "confirmed") return false;
    if (filter === "attention" && status === "confirmed") return false;
    if (search.trim()) {
      const hay = `${getLocalAccountLabel(m)} ${getOdooAccountName(m)}`.toLowerCase();
      if (!hay.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  /**
   * On suggested rows `odoo_account` IS the suggested account; on
   * confirmed rows it is the confirmed one. Unsaved local edits win.
   */
  const chosenValue = (m: AccountMapping): string | null => {
    const dirtyValue = dirty[String(getMappingId(m))];
    if (dirtyValue) return dirtyValue;
    const current = getOdooAccountId(m);
    return current === null ? null : String(current);
  };

  const handleSave = async () => {
    setSaveError(false);
    setActionError(null);
    const results = await Promise.all(
      Object.entries(dirty).map(([mappingId, odooAccountId]) =>
        confirm({
          /* Documented body: { odoo_account_id }. */
          mappingId: Number(mappingId),
          odooAccountId: Number(odooAccountId),
        }),
      ),
    );
    if (results.some((res) => res.error)) {
      setSaveError(true);
      return;
    }
    setDirty({});
  };

  const handleSuggest = async () => {
    const res = await suggest();
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not generate suggestions. Check the Odoo connection and try again.",
      );
      return;
    }
    setActionError(null);
    setSaveError(false);
    setSuggestSummary(res.data ?? null);
  };

  const suggestButton = (
    <Button
      type="button"
      size="sm"
      loading={suggestState.isLoading}
      onClick={() => void handleSuggest()}
    >
      Suggest mappings
    </Button>
  );

  /* Render grouped sections (e.g. "Expense and cost accounts",
     "Other accounts") whenever the API supplies a type per row. */
  let lastGroup: string | null | undefined;

  return (
    <div>
      <PageHeader
        title="Chart of accounts mapping"
        subtitle="Match each FastrSuite account to its Odoo account."
        actions={
          rows.length === 0 ? (
            suggestButton
          ) : (
            <Button
              type="button"
              disabled={dirtyCount === 0}
              loading={confirmState.isLoading}
              onClick={() => void handleSave()}
            >
              Save mapping
            </Button>
          )
        }
      />

      {mappingsQuery.isError ? (
        <Banner
          variant="error"
          title="We could not load account mappings"
          className="mt-4"
          action={
            <Button type="button" variant="outline" onClick={() => void mappingsQuery.refetch()}>
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
      ) : rows.length === 0 ? (
        <Banner
          variant="error"
          title="No account mappings yet"
          className="mt-4"
          action={suggestButton}
        >
          Suggest mappings to match your FastrSuite accounts to their Odoo accounts.
        </Banner>
      ) : saveError ? (
        <Banner variant="error" title="Some mappings could not be saved" className="mt-4">
          Your changes are still selected. Try saving again.
        </Banner>
      ) : completeCount === rows.length ? (
        <Banner variant="success" title="All accounts are mapped" className="mt-4">
          Vendor bills can sync for every account.
        </Banner>
      ) : (
        <Banner
          variant="error"
          title={`${attentionCount} account${attentionCount === 1 ? "" : "s"} need${
            attentionCount === 1 ? "s" : ""
          } mapping`}
          className="mt-4"
        >
          Bills using unmapped accounts cannot sync.
        </Banner>
      )}

      {suggestSummary ? (
        <Banner variant="info" title="Suggestions generated" className="mt-3">
          {suggestSummary.mappings_created ?? 0} created ·{" "}
          {suggestSummary.mappings_refreshed ?? 0} refreshed ·{" "}
          {suggestSummary.unmatched ?? 0} unmatched
        </Banner>
      ) : null}

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search accounts"
          className="w-full max-w-xl"
        />
        <div className="flex items-center gap-2">
          <FilterPill active={filter === "all"} count={rows.length} onClick={() => setFilter("all")}>
            All
          </FilterPill>
          <FilterPill
            active={filter === "attention"}
            count={attentionCount}
            onClick={() => setFilter("attention")}
          >
            Needs attention
          </FilterPill>
          <FilterPill
            active={filter === "complete"}
            count={completeCount}
            onClick={() => setFilter("complete")}
          >
            Complete
          </FilterPill>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        {mappingsQuery.isLoading || (rows.length > 0 && accountsQuery.isLoading) ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="rounded-l-md px-4 py-2.5 font-normal">FastrSuite account</th>
                <th className="px-4 py-2.5 font-normal">Odoo account</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="rounded-r-md px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => {
                const id = String(getMappingId(m));
                const groupType = getLocalAccountType(m);
                const group = groupType ? accountGroupLabel(groupType) : null;
                const status = getMappingStatus(m);
                const complete = status === "confirmed";
                const groupHeader =
                  group && group !== lastGroup ? (
                    <tr key={`${id}-group`} className="bg-white">
                      <td
                        colSpan={4}
                        className="px-4 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-gray-400"
                      >
                        {group}
                      </td>
                    </tr>
                  ) : null;
                lastGroup = group;
                return (
                  <Fragment key={id}>
                    {groupHeader}
                    <tr className="align-middle">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getLocalAccountLabel(m)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full max-w-sm">
                          <Select
                            placeholder="Select Odoo account"
                            value={chosenValue(m)}
                            onChange={(v) => setDirty((prev) => ({ ...prev, [id]: v }))}
                            options={accountOptions}
                            disabled={accountOptions.length === 0}
                            className="h-9"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {complete ? (
                          <Pill variant="success">Complete</Pill>
                        ) : (
                          <Pill variant="danger">Needs attention</Pill>
                        )}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </Fragment>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No accounts match the current search or filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
