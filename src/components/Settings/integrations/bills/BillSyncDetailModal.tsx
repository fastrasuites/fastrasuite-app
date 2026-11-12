"use client";

import { DetailModal, DetailField, DetailSectionTitle } from "../shared/DetailModal";
import { Banner, Button } from "../shared/primitives";
import { AttemptTimeline, SyncStatusPill, formatNaira } from "../shared/SyncComponents";
import type { VendorBill } from "./mockData";

const DEFAULT_FAILURE =
  "All automatic attempts have failed. Fix the cause, or contact support if it continues.";

/** Detail card for a vendor bill ("BILL-0411"), matching the prototype. */
export function BillSyncDetailModal({
  bill,
  open,
  onClose,
}: {
  bill: VendorBill | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!bill) return null;

  const showRetry = bill.status === "failed" || bill.status === "retrying";
  const showViewInApp = bill.status === "synced" || bill.status === "posted";

  return (
    <DetailModal
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={bill.bill_number}
      badge={<SyncStatusPill status={bill.status} />}
      footer={
        showRetry ? (
          /* TODO(backend): wire to the bill sync/retry endpoint when it is
             documented – the swagger does not include sync actions yet. */
          <Button
            type="button"
            className="w-full"
            disabled
            title="Retry becomes available once the sync endpoints are documented"
          >
            Retry now
          </Button>
        ) : showViewInApp ? (
          /* TODO(app): point at your vendor-bill detail route, e.g.
             router.push(`/invoicing/bills/${bill.id}`). */
          <Button type="button" variant="outline" className="w-full" disabled title="Navigation target pending – wire to your bill detail route">
            View in FastraSuite
          </Button>
        ) : null
      }
    >
      {bill.status === "failed" ? (
        <Banner variant="error" title="Sync failed" className="mb-5">
          {bill.failure_reason ?? DEFAULT_FAILURE}
        </Banner>
      ) : null}

      <DetailSectionTitle>Sync details</DetailSectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
        <DetailField label="Bill number">{bill.bill_number}</DetailField>
        <DetailField label="Vendor">{bill.vendor}</DetailField>
        <DetailField label="Amount">{formatNaira(bill.amount)}</DetailField>
        <DetailField label="Odoo reference">{bill.odoo_reference ?? "-"}</DetailField>
        <DetailField label="Sync status">
          <SyncStatusPill status={bill.status} />
        </DetailField>
        <DetailField label="Last attempt">{bill.last_attempt ?? "-"}</DetailField>
        <DetailField label="Attempts">
          {bill.max_attempts ? `${bill.attempts} of ${bill.max_attempts}` : bill.attempts}
        </DetailField>
        <DetailField label="Next scheduled retry">{bill.next_retry ?? "Not scheduled"}</DetailField>
      </div>

      <div className="mt-6">
        <DetailSectionTitle>Attempts</DetailSectionTitle>
        <div className="mt-4">
          <AttemptTimeline attempts={bill.attempts_log} />
        </div>
      </div>
    </DetailModal>
  );
}
