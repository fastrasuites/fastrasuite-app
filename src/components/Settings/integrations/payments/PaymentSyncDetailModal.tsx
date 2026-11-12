"use client";

import { DetailModal, DetailField, DetailSectionTitle } from "../shared/DetailModal";
import { Button } from "../shared/primitives";
import { AttemptTimeline, SyncStatusPill, formatNaira } from "../shared/SyncComponents";
import type { VendorPayment } from "../bills/mockData";

/** Detail card for a payment ("PAY-0387"), matching the prototype. */
export function PaymentSyncDetailModal({
  payment,
  open,
  onClose,
}: {
  payment: VendorPayment | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!payment) return null;

  const synced = payment.status === "synced" || payment.status === "posted";

  return (
    <DetailModal
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={payment.payment_reference}
      badge={<SyncStatusPill status={payment.status} />}
      footer={
        synced ? (
          <>
            {/* TODO(app): route to the payment record in FastrSuite. */}
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled
              title="Navigation target pending – wire to your payment detail route"
            >
              View in FastraSuite
            </Button>
            {/* TODO(backend): build the Odoo deep link from the connection
                payload once it exposes record URLs. */}
            <Button
              type="button"
              className="flex-1"
              disabled
              title="Odoo deep link becomes available once the connection payload exposes record URLs"
            >
              View in Odoo
            </Button>
          </>
        ) : null
      }
    >
      <DetailSectionTitle>Sync details</DetailSectionTitle>
      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5">
        <DetailField label="Payment reference">{payment.payment_reference}</DetailField>
        <DetailField label="Vendor">{payment.vendor}</DetailField>
        <DetailField label="Related bill">{payment.related_bill}</DetailField>
        <DetailField label="Amount">{formatNaira(payment.amount)}</DetailField>
        <DetailField label="Payment date">{payment.payment_date}</DetailField>
        <DetailField label="Odoo reference">{payment.odoo_reference ?? "-"}</DetailField>
        <DetailField label="Sync status">
          <SyncStatusPill status={payment.status} />
        </DetailField>
        <DetailField label="Last attempt">{payment.last_attempt ?? "-"}</DetailField>
        <DetailField label="Attempts">
          {payment.max_attempts
            ? `${payment.attempts} of ${payment.max_attempts}`
            : payment.attempts}
        </DetailField>
        <DetailField label="Next scheduled retry">
          {payment.next_retry ?? "Not scheduled"}
        </DetailField>
      </div>

      <div className="mt-6">
        <DetailSectionTitle>Attempts</DetailSectionTitle>
        <div className="mt-4">
          <AttemptTimeline attempts={payment.attempts_log} />
        </div>
      </div>
    </DetailModal>
  );
}
