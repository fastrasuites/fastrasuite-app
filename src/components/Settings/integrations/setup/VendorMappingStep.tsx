"use client";

import {
  getErrorDetail,
  getMappingId,
  getMappingStatus,
  getOdooPartnerId,
  getOdooPartnerName,
  getPartnerId,
  getPartnerLabel,
  getVendorName,
  useConfirmVendorMappingMutation,
  useGetPartnersQuery,
  useGetVendorMappingsQuery,
  useRejectVendorMappingMutation,
  useSuggestVendorMappingsMutation,
  type MappingSuggestSummary,
  type VendorMapping,
} from "@/api/settings/integrationsApi";
import { useRef, useState } from "react";
import { ConfirmDialog } from "../shared/ConfirmDialog";
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

type VendorFilter = "all" | "unmapped" | "confirmed";

interface ReplaceTarget {
  mapping: VendorMapping;
  newPartnerId: string;
  newPartnerName: string;
}

/** "Vendor mapping" step: map each FastraSuite vendor to an Odoo contact. */
export function VendorMappingStep() {
  const mappingsQuery = useGetVendorMappingsQuery();
  const partnersQuery = useGetPartnersQuery();
  const [suggest, suggestState] = useSuggestVendorMappingsMutation();
  const [confirm, confirmState] = useConfirmVendorMappingMutation();
  const [reject, rejectState] = useRejectVendorMappingMutation();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VendorFilter>("all");
  /** Rows being re-pointed before Confirm is pressed. */
  const [pendingChoice, setPendingChoice] = useState<Record<string, string>>(
    {},
  );
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  /** Counters from the latest successful POST /vendor-mappings/suggest/. */
  const [suggestSummary, setSuggestSummary] =
    useState<MappingSuggestSummary | null>(null);

  /** Lets the "Change" button open the row's select dropdown. */
  const selectTriggers = useRef<Record<string, HTMLButtonElement | null>>({});

  const rows = mappingsQuery.data ?? [];
  /* Only supplier contacts make sense as mapping targets. */
  const partnerOptions = (partnersQuery.data ?? [])
    .filter((p) => p.supplier !== false)
    .map((p) => ({
      value: String(getPartnerId(p)),
      label: getPartnerLabel(p),
    }));

  const filtered = rows.filter((m) => {
    const status = getMappingStatus(m);
    if (filter === "confirmed" && status !== "confirmed") return false;
    if (filter === "unmapped" && status === "confirmed") return false;
    if (search.trim()) {
      const haystack =
        `${getVendorName(m)} ${getOdooPartnerName(m)}`.toLowerCase();
      if (!haystack.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const confirmedCount = rows.filter(
    (m) => getMappingStatus(m) === "confirmed",
  ).length;
  const unmappedCount = rows.length - confirmedCount;

  /**
   * On suggested rows `odoo_partner` IS the suggested contact; on
   * confirmed rows it is the confirmed one – either way it is the value
   * the select should show (unless the user picked another one).
   */
  const chosenValue = (m: VendorMapping): string | null => {
    const pending = pendingChoice[String(getMappingId(m))];
    if (pending) return pending;
    const current = getOdooPartnerId(m);
    return current === null ? null : String(current);
  };

  const handleSelect = (m: VendorMapping, value: string) => {
    const id = String(getMappingId(m));
    const currentId = getOdooPartnerId(m);
    if (getMappingStatus(m) === "confirmed" && currentId !== null) {
      const name =
        partnerOptions.find((o) => o.value === value)?.label ??
        "the selected contact";
      setReplaceTarget({
        mapping: m,
        newPartnerId: value,
        newPartnerName: name,
      });
      return;
    }
    setPendingChoice((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirmRow = async (m: VendorMapping) => {
    const id = getMappingId(m);
    const partnerId = chosenValue(m);
    const res = await confirm({
      mappingId: id,
      /* Documented body: { odoo_partner_id } – omitted confirms the
       * suggested partner as-is. */
      odooPartnerId: partnerId !== null ? Number(partnerId) : undefined,
    });
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not confirm the mapping. Please try again.",
      );
      return;
    }
    setActionError(null);
    setPendingChoice((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });
  };

  const handleReplace = async () => {
    if (!replaceTarget) return;
    const { mapping, newPartnerId } = replaceTarget;
    setReplaceTarget(null);
    const res = await confirm({
      mappingId: getMappingId(mapping),
      odooPartnerId: Number(newPartnerId),
    });
    if (res.error) {
      setActionError(
        getErrorDetail(res.error) ??
          "Could not replace the mapping. Please try again.",
      );
    }
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

  const renderStatusPill = (status: string) => {
    if (status === "confirmed") return <Pill variant="success">Confirmed</Pill>;
    if (status === "suggested") return <Pill variant="info">Suggested</Pill>;
    if (status === "rejected") return <Pill variant="danger">Rejected</Pill>;
    return <Pill variant="danger">Needs attention</Pill>;
  };

  return (
    <div>
      <PageHeader
        title="Vendor mapping"
        subtitle="Link each FastraSuite vendor to its Odoo contact."
        actions={rows.length === 0 ? suggestButton : undefined}
      />

      {mappingsQuery.isError ? (
        <Banner
          variant="error"
          title="We could not load vendor mappings"
          className="mt-4"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void mappingsQuery.refetch()}
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
      ) : rows.length === 0 ? (
        <Banner
          variant="error"
          title="No vendor mappings yet"
          className="mt-4"
          action={suggestButton}
        >
          Suggest mappings to link your FastraSuite vendors to their Odoo
          contacts. Vendor bills cannot sync until vendors are mapped.
        </Banner>
      ) : confirmedCount === rows.length ? (
        <Banner
          variant="success"
          title="All vendors are mapped"
          className="mt-4"
        >
          Vendor bills can now sync for every vendor.
        </Banner>
      ) : (
        <Banner
          variant="error"
          title={`${unmappedCount} vendor${unmappedCount === 1 ? "" : "s"} need mapping`}
          className="mt-4"
        >
          Vendor bills for unmapped vendors cannot sync.
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
          placeholder="Search vendors or Odoo contacts"
          className="w-full max-w-xl"
        />
        <div className="flex items-center gap-2">
          <FilterPill
            active={filter === "all"}
            count={rows.length}
            onClick={() => setFilter("all")}
          >
            All
          </FilterPill>
          <FilterPill
            active={filter === "unmapped"}
            count={unmappedCount}
            onClick={() => setFilter("unmapped")}
          >
            Not mapped
          </FilterPill>
          <FilterPill
            active={filter === "confirmed"}
            count={confirmedCount}
            onClick={() => setFilter("confirmed")}
          >
            Confirmed
          </FilterPill>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        {mappingsQuery.isLoading ||
        (rows.length > 0 && partnersQuery.isLoading) ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="rounded-l-md px-4 py-2.5 font-normal">
                  FastraSuite vendor
                </th>
                <th className="px-4 py-2.5 font-normal">Odoo contact</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="rounded-r-md px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => {
                const id = String(getMappingId(m));
                const status = getMappingStatus(m);
                const confirmed = status === "confirmed";
                return (
                  <tr key={id} className="align-middle">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getVendorName(m)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-xs">
                        <Select
                          placeholder="Select Odoo contact"
                          value={chosenValue(m)}
                          onChange={(v) => handleSelect(m, v)}
                          options={partnerOptions}
                          disabled={partnerOptions.length === 0}
                          className="h-9"
                          triggerRef={(el) => {
                            selectTriggers.current[id] = el;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderStatusPill(status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {confirmed ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectTriggers.current[id]?.click()}
                          >
                            Change
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              loading={confirmState.isLoading}
                              onClick={() => void handleConfirmRow(m)}
                            >
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              variant="neutral"
                              size="sm"
                              loading={rejectState.isLoading}
                              onClick={() =>
                                void reject({ mappingId: getMappingId(m) })
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No vendors match the current search or filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!replaceTarget}
        onOpenChange={(open) => {
          if (!open) setReplaceTarget(null);
        }}
        title="Replace saved mapping?"
        description={
          replaceTarget
            ? `${getVendorName(replaceTarget.mapping)} is mapped to ${
                getOdooPartnerName(replaceTarget.mapping) ||
                "the current contact"
              }. Replace it with ${replaceTarget.newPartnerName}?`
            : ""
        }
        confirmLabel="Replace mapping"
        loading={confirmState.isLoading}
        onConfirm={() => void handleReplace()}
      />
    </div>
  );
}
