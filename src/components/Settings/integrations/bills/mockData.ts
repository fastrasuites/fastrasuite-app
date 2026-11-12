import type { SyncAttempt, SyncStatus } from "../shared/SyncComponents";

/* ------------------------------------------------------------------ */
/* Types – mirrors the prototype. When the backend ships the bills /   */
/* payments sync endpoints (GET /vendor-bills/, GET /payments/, ...)   */
/* delete the MOCK constants and feed these same interfaces from       */
/* integrationsApi.ts queries.                                         */
/* TODO(backend): endpoints not in the swagger yet (11 Nov 2026).      */
/* ------------------------------------------------------------------ */

export interface VendorBill {
  id: string;
  bill_number: string;
  vendor: string;
  amount: number;
  odoo_reference: string | null;
  status: SyncStatus;
  last_attempt: string | null;
  attempts: number;
  max_attempts: number | null;
  next_retry: string | null;
  failure_reason: string | null;
  attempts_log: SyncAttempt[];
}

export interface VendorPayment {
  id: string;
  payment_reference: string;
  vendor: string;
  related_bill: string;
  amount: number;
  payment_date: string;
  odoo_reference: string | null;
  status: SyncStatus;
  last_attempt: string | null;
  attempts: number;
  max_attempts: number | null;
  next_retry: string | null;
  failure_reason: string | null;
  attempts_log: SyncAttempt[];
}

export interface SyncStats {
  total: number;
  synced: number;
  pending: number;
  failed: number;
}

/* ------------------------------------------------------------------ */
/* Mock data – mirrors the Accounting Integration prototype exactly.   */
/* ------------------------------------------------------------------ */

export const VENDOR_BILL_STATS: SyncStats = { total: 128, synced: 109, pending: 12, failed: 7 };

export const PAYMENT_STATS: SyncStats = { total: 94, synced: 80, pending: 9, failed: 5 };

export const VENDOR_BILLS: VendorBill[] = [
  {
    id: "1",
    bill_number: "BILL-0412",
    vendor: "Northwind Supplies",
    amount: 4820000,
    odoo_reference: null,
    status: "failed",
    last_attempt: "30 Oct, 09:42",
    attempts: 5,
    max_attempts: 5,
    next_retry: null,
    failure_reason:
      "All automatic attempts have failed. The vendor Northwind Supplies is not mapped to an Odoo contact. Fix the cause, or contact support if it continues.",
    attempts_log: [
      { outcome: "error", title: "Failed: vendor not mapped", at: "30 Oct, 09:42" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "30 Oct, 08:42" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "30 Oct, 07:42" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "30 Oct, 06:42" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "30 Oct, 05:42" },
    ],
  },
  {
    id: "2",
    bill_number: "BILL-0411",
    vendor: "Greenfield Foods",
    amount: 960500,
    odoo_reference: "BILL/2026/0411",
    status: "synced",
    last_attempt: "29 Oct, 14:05",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as BILL/2026/0411", at: "29 Oct, 14:05" },
    ],
  },
  {
    id: "3",
    bill_number: "BILL-0410",
    vendor: "Bluepeak Services",
    amount: 7415000,
    odoo_reference: "BILL/2026/0410",
    status: "posted",
    last_attempt: "28 Oct, 11:20",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as BILL/2026/0410", at: "28 Oct, 11:20" },
    ],
  },
  {
    id: "4",
    bill_number: "BILL-0409",
    vendor: "Acme Logistics",
    amount: 540000,
    odoo_reference: null,
    status: "retrying",
    last_attempt: "30 Oct, 09:40",
    attempts: 2,
    max_attempts: 5,
    next_retry: "Next retry in 8 min",
    failure_reason: "Odoo rejected the bill: missing purchase journal on line 1.",
    attempts_log: [
      { outcome: "error", title: "Failed: missing purchase journal", at: "30 Oct, 09:40" },
      { outcome: "error", title: "Failed: missing purchase journal", at: "30 Oct, 08:40" },
    ],
  },
  {
    id: "5",
    bill_number: "BILL-0408",
    vendor: "Sunrise Cement",
    amount: 2300000,
    odoo_reference: null,
    status: "processing",
    last_attempt: "30 Oct, 09:45",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [],
  },
  {
    id: "6",
    bill_number: "BILL-0407",
    vendor: "Delta Haulage",
    amount: 1125000,
    odoo_reference: null,
    status: "pending",
    last_attempt: null,
    attempts: 0,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [],
  },
  {
    id: "7",
    bill_number: "BILL-0406",
    vendor: "Northwind Supplies",
    amount: 3100000,
    odoo_reference: "BILL/2026/0406",
    status: "synced",
    last_attempt: "27 Oct, 16:02",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as BILL/2026/0406", at: "27 Oct, 16:02" },
    ],
  },
];

export const VENDOR_PAYMENTS: VendorPayment[] = [
  {
    id: "1",
    payment_reference: "PAY-0389",
    vendor: "Bluepeak Services",
    related_bill: "BILL-0410",
    amount: 4415000,
    payment_date: "30 Oct 2026",
    odoo_reference: null,
    status: "processing",
    last_attempt: "30 Oct, 09:46",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [],
  },
  {
    id: "2",
    payment_reference: "PAY-0388",
    vendor: "Acme Logistics",
    related_bill: "BILL-0409",
    amount: 540000,
    payment_date: "30 Oct 2026",
    odoo_reference: null,
    status: "retrying",
    last_attempt: "30 Oct, 09:41",
    attempts: 2,
    max_attempts: 5,
    next_retry: "Next retry in 8 min",
    failure_reason: "Odoo rejected the payment: the related bill has not been posted yet.",
    attempts_log: [
      { outcome: "error", title: "Failed: related bill not posted", at: "30 Oct, 09:41" },
      { outcome: "error", title: "Failed: related bill not posted", at: "30 Oct, 08:41" },
    ],
  },
  {
    id: "3",
    payment_reference: "PAY-0387",
    vendor: "Northwind Supplies",
    related_bill: "BILL-0406",
    amount: 3100000,
    payment_date: "28 Oct 2026",
    odoo_reference: "PAY/2026/0387",
    status: "synced",
    last_attempt: "28 Oct, 14:10",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as PAY/2026/0387", at: "28 Oct, 14:10" },
    ],
  },
  {
    id: "4",
    payment_reference: "PAY-0386",
    vendor: "Greenfield Foods",
    related_bill: "BILL-0411",
    amount: 960500,
    payment_date: "27 Oct 2026",
    odoo_reference: "PAY/2026/0386",
    status: "synced",
    last_attempt: "27 Oct, 15:10",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as PAY/2026/0386", at: "27 Oct, 15:10" },
    ],
  },
  {
    id: "5",
    payment_reference: "PAY-0385",
    vendor: "Bluepeak Services",
    related_bill: "BILL-0410",
    amount: 3000000,
    payment_date: "28 Oct 2026",
    odoo_reference: "PAY/2026/0385",
    status: "synced",
    last_attempt: "28 Oct, 14:00",
    attempts: 1,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [
      { outcome: "success", title: "Synced to Odoo as PAY/2026/0385", at: "28 Oct, 14:00" },
    ],
  },
  {
    id: "6",
    payment_reference: "PAY-0384",
    vendor: "Delta Haulage",
    related_bill: "BILL-0407",
    amount: 500000,
    payment_date: "26 Oct 2026",
    odoo_reference: null,
    status: "failed",
    last_attempt: "26 Oct, 10:30",
    attempts: 5,
    max_attempts: 5,
    next_retry: null,
    failure_reason:
      "All automatic attempts have failed. The vendor Delta Haulage is not mapped to an Odoo contact. Fix the cause, or contact support if it continues.",
    attempts_log: [
      { outcome: "error", title: "Failed: vendor not mapped", at: "26 Oct, 10:30" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "26 Oct, 09:30" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "26 Oct, 08:30" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "26 Oct, 07:30" },
      { outcome: "error", title: "Failed: vendor not mapped", at: "26 Oct, 06:30" },
    ],
  },
  {
    id: "7",
    payment_reference: "PAY-0383",
    vendor: "Sunrise Cement",
    related_bill: "BILL-0408",
    amount: 2300000,
    payment_date: "25 Oct 2026",
    odoo_reference: null,
    status: "pending",
    last_attempt: null,
    attempts: 0,
    max_attempts: null,
    next_retry: null,
    failure_reason: null,
    attempts_log: [],
  },
];
