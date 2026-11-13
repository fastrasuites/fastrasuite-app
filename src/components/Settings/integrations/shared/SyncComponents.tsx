"use client";

import type { ReactNode } from "react";
import { Button, Pill, type PillVariant } from "./primitives";
import { cn } from "./utils";

/* ------------------------------------------------------------------ */
/* Sync status (Vendor Bills / Payments tables + detail modals)        */
/* ------------------------------------------------------------------ */

export type SyncStatus =
  | "synced"
  | "posted"
  | "processing"
  | "pending"
  | "failed"
  | "retrying";

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: "Synced",
  posted: "Posted",
  processing: "Processing",
  pending: "Pending",
  failed: "Failed",
  retrying: "Retrying",
};

const SYNC_STATUS_VARIANTS: Record<SyncStatus, PillVariant> = {
  synced: "success",
  posted: "success",
  processing: "info",
  pending: "gray",
  failed: "danger",
  retrying: "danger-outline",
};

export const isSyncStatus = (value: string): value is SyncStatus =>
  Object.prototype.hasOwnProperty.call(SYNC_STATUS_LABELS, value);

export function SyncStatusPill({ status }: { status: SyncStatus }) {
  return (
    <Pill variant={SYNC_STATUS_VARIANTS[status]}>
      {SYNC_STATUS_LABELS[status]}
    </Pill>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card (Total / Synced / Pending / Failed)                       */
/* ------------------------------------------------------------------ */

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "2 setup items need attention" banner (Vendor Bills + Payments)     */
/* ------------------------------------------------------------------ */

export function SetupAttentionBanner({
  items,
  onReview,
}: {
  items: string[];
  onReview: () => void;
}) {
  if (items.length === 0) return null;
  const label =
    items.length === 1
      ? "1 setup item needs attention"
      : `${items.length} setup items need attention`;
  const reason =
    items.length === 1
      ? `${items[0]} is incomplete. Related records cannot sync until it is completed.`
      : `${items.join(" and ")} are incomplete. Records that depend on them cannot sync.`;
  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-300 bg-red-100 p-4">
      <div>
        <p className="text-[15px] font-semibold text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-700">{reason}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onReview}
        className="bg-transparent"
      >
        Review setup
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attempts timeline inside a detail modal                             */
/* ------------------------------------------------------------------ */

export interface SyncAttempt {
  outcome: "success" | "error" | "neutral";
  title: string;
  at?: string | null;
}

const dotColors: Record<SyncAttempt["outcome"], string> = {
  success: "bg-green-600",
  error: "bg-red-500",
  neutral: "bg-gray-400",
};

export function AttemptTimeline({ attempts }: { attempts: SyncAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gray-400" />
        <div>
          <p className="text-[15px] font-medium text-gray-900">
            No attempts yet
          </p>
          <p className="text-sm text-gray-500">
            FastraSuite will start syncing automatically.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {attempts.map((attempt, index) => (
        <li key={index} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
              dotColors[attempt.outcome],
            )}
          />
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-gray-900">
              {attempt.title}
            </p>
            {attempt.at ? (
              <p className="text-sm text-gray-500">{attempt.at}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Money formatting (Naira, matches the prototype)                     */
/* ------------------------------------------------------------------ */

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
