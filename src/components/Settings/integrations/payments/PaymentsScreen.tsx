"use client";

import { useMemo, useState } from "react";
import { SetupAttentionBanner, StatCard, SyncStatusPill, formatNaira } from "../shared/SyncComponents";
import { PageHeader, SearchInput, Select } from "../shared/primitives";
import { useSetupStatus } from "../setup/useSetupStatus";
import { PaymentSyncDetailModal } from "./PaymentSyncDetailModal";
import { VENDOR_PAYMENTS, PAYMENT_STATS, type VendorPayment } from "../bills/mockData";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "synced", label: "Synced" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "retrying", label: "Retrying" },
  { value: "failed", label: "Failed" },
];

const DATE_OPTIONS = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

/**
 * "Payments" tab: setup-attention banner, stat cards, filters and the
 * payment sync queue. Data currently comes from the typed mock in
 * ../bills/mockData.ts – swap in the payments API queries when the
 * backend documents them (TODO(backend)).
 */
export function PaymentsScreen({ onReviewSetup }: { onReviewSetup: () => void }) {
  const { attentionLabels } = useSetupStatus();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  /* TODO(backend): date filtering needs real timestamps from the API. */
  const [dateRange, setDateRange] = useState("30d");
  const [selected, setSelected] = useState<VendorPayment | null>(null);

  const rows = useMemo(() => {
    return VENDOR_PAYMENTS.filter((payment) => {
      if (status !== "all" && payment.status !== status) return false;
      if (search.trim()) {
        const hay = `${payment.payment_reference} ${payment.vendor} ${payment.related_bill} ${
          payment.odoo_reference ?? ""
        }`.toLowerCase();
        if (!hay.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [search, status]);

  return (
    <div className="px-8 py-6">
      <SetupAttentionBanner items={attentionLabels} onReview={onReviewSetup} />

      <PageHeader title="Payments" subtitle="Payments linked to synchronized vendor bills." />

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={PAYMENT_STATS.total} />
        <StatCard label="Synced" value={PAYMENT_STATS.synced} />
        <StatCard label="Pending / Processing" value={PAYMENT_STATS.pending} />
        <StatCard label="Failed" value={PAYMENT_STATS.failed} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reference or vendor"
          className="w-full max-w-xl"
        />
        <div className="w-48">
          <Select
            placeholder="Status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-48">
          <Select
            placeholder="Date"
            value={dateRange}
            onChange={setDateRange}
            options={DATE_OPTIONS}
          />
        </div>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600">
            <th className="rounded-l-md px-4 py-2.5 font-normal">Payment reference</th>
            <th className="px-4 py-2.5 font-normal">Vendor</th>
            <th className="px-4 py-2.5 font-normal">Related bill</th>
            <th className="px-4 py-2.5 font-normal">Amount</th>
            <th className="px-4 py-2.5 font-normal">Payment date</th>
            <th className="px-4 py-2.5 font-normal">Odoo reference</th>
            <th className="px-4 py-2.5 font-normal">Status</th>
            <th className="px-4 py-2.5 font-normal">Last attempt</th>
            <th className="rounded-r-md px-4 py-2.5 font-normal">Attempts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((payment) => (
            <tr
              key={payment.id}
              onClick={() => setSelected(payment)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-3.5 font-medium text-gray-900">
                {payment.payment_reference}
              </td>
              <td className="px-4 py-3.5 text-gray-700">{payment.vendor}</td>
              <td className="px-4 py-3.5 text-gray-700">{payment.related_bill}</td>
              <td className="px-4 py-3.5 text-gray-900">{formatNaira(payment.amount)}</td>
              <td className="px-4 py-3.5 text-gray-700">{payment.payment_date}</td>
              <td className="px-4 py-3.5 text-gray-700">{payment.odoo_reference ?? "-"}</td>
              <td className="px-4 py-3.5">
                <SyncStatusPill status={payment.status} />
                {payment.status === "retrying" && payment.next_retry ? (
                  <p className="mt-1 text-xs text-gray-500">{payment.next_retry}</p>
                ) : null}
              </td>
              <td className="px-4 py-3.5 text-gray-700">{payment.last_attempt ?? "-"}</td>
              <td className="px-4 py-3.5 text-gray-700">
                {payment.max_attempts
                  ? `${payment.attempts} of ${payment.max_attempts}`
                  : payment.attempts}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                No payments match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-gray-400">
        Tip: click a payment to see its sync details and attempt history.
      </p>

      <PaymentSyncDetailModal
        payment={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
