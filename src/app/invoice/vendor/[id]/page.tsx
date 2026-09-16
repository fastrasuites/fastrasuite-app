"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Hash,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { UpdateBankDetailsModal } from "@/components/invoice/vendor/UpdateBankDetailsModal";
import { useGetVendorByIdQuery } from "@/api/invoice/vendorsApi";
import { useConfirmVendorBankAccountMutation } from "@/api/invoice/vendorBankAccountsApi";
import { ToastNotification } from "@/components/shared/ToastNotification";
import { Button } from "@/components/ui/button";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function TruncateWithTooltip({
  value,
  maxLength = 40,
  className = "",
}: {
  value?: string | null;
  maxLength?: number;
  className?: string;
}) {
  if (!value) return <span className={className}>—</span>;
  const needsTruncate = value.length > maxLength;
  const display = needsTruncate ? `${value.slice(0, maxLength)}…` : value;

  return (
    <span
      className={`inline-block max-w-full truncate ${className}`}
      title={needsTruncate ? value : undefined}
    >
      {display}
    </span>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 break-words">
        {value ?? "—"}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-100" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-6">
        <div className="h-7 w-56 rounded bg-gray-100" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-20 rounded bg-gray-100" />
              <div className="h-5 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <div className="h-6 w-40 rounded bg-gray-100" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-24 rounded bg-gray-100" />
              <div className="h-5 w-36 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function VendorInfoPage() {
  const router = useRouter();
  const params = useParams();
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const vendorIdStr = (params?.id as string) || "";
  const vendorId = parseInt(vendorIdStr, 10);

  const {
    data: vendor,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetVendorByIdQuery(vendorId, {
    skip: isNaN(vendorId),
  });

  const [confirmBank, { isLoading: isConfirming }] =
    useConfirmVendorBankAccountMutation();

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const bankAccount =
    vendor?.bank_account && typeof vendor.bank_account === "object"
      ? (vendor.bank_account as any)
      : null;

  const isBankConfirmed = Boolean(bankAccount?.confirmed);
  const hasBankDetails = Boolean(
    bankAccount?.bank_account_name ||
    bankAccount?.bank_account_number ||
    bankAccount?.bank_name,
  );

  const handleConfirmBank = async () => {
    if (!vendor) return;

    try {
      // Same payload structure as update vendor bank account
      const payload = {
        bank_account_name: bankAccount?.bank_account_name || "",
        bank_account_number: bankAccount?.bank_account_number || "",
        bank_name: bankAccount?.bank_name || "",
        branch_code: bankAccount?.branch_code || "",
      };

      await confirmBank({ id: vendorId, data: payload } as any).unwrap();
      showToast("Bank account confirmed successfully", "success");
      refetch();
    } catch (err: any) {
      showToast(
        err?.data?.message ||
          err?.data?.detail ||
          err?.message ||
          "Failed to confirm bank account",
        "error",
      );
    }
  };

  return (
    <PageGuard module="invoice" entitlement="configure_invoice">
      <div className="min-h-screen space-y-6 bg-gray-50 p-4 sm:p-6">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/invoice/settings?tab=vendor")}
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              aria-label="Back to vendors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Vendor Info
              </h1>
              <p className="text-sm text-gray-500">
                View and manage vendor profile & bank details
              </p>
            </div>
          </div>

          {!isLoading && vendor && (
            <PermissionGuard module="invoice" entitlement="configure_invoice">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/invoice/vendor/edit/${vendorIdStr}`)
                }
                className="inline-flex items-center gap-2 self-start sm:self-auto"
              >
                <Edit2 className="h-4 w-4" />
                Edit Vendor
              </Button>
            </PermissionGuard>
          )}
        </div>

        {isLoading || isFetching ? (
          <DetailSkeleton />
        ) : isError || !vendor ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-red-500">
            Failed to load vendor.
          </div>
        ) : (
          <>
            {/* ── Profile card ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2
                    className="truncate text-2xl font-semibold text-gray-900"
                    title={vendor.vendor_name}
                  >
                    {vendor.vendor_name}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {vendor.vendor_code}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    vendor.status?.toLowerCase() === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {vendor.status || "Unknown"}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                <InfoField
                  label="Contact Name"
                  value={
                    <TruncateWithTooltip
                      value={vendor.contact_name}
                      maxLength={36}
                    />
                  }
                  icon={<User className="h-3.5 w-3.5" />}
                />
                <InfoField
                  label="Email Address"
                  value={
                    <TruncateWithTooltip value={vendor.email} maxLength={36} />
                  }
                  icon={<Mail className="h-3.5 w-3.5" />}
                />
                <InfoField
                  label="Phone Number"
                  value={vendor.phone_number || "—"}
                  icon={<Phone className="h-3.5 w-3.5" />}
                />
                <InfoField
                  label="Address"
                  value={
                    <TruncateWithTooltip
                      value={vendor.address}
                      maxLength={48}
                    />
                  }
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />

                {/* Tax information */}
                {/* 
                <InfoField
                  label="Tax ID"
                  value={(vendor as any).tax_id || "—"}
                  icon={<Hash className="h-3.5 w-3.5" />}
                />
                <InfoField
                  label="Tax Registered"
                  value={
                    (vendor as any).tax_registered === true
                      ? "Yes"
                      : (vendor as any).tax_registered === false
                        ? "No"
                        : "—"
                  }
                />
                {(vendor as any).tax_number && (
                  <InfoField
                    label="Tax Number"
                    value={(vendor as any).tax_number}
                  />
                )}
                 */}

                <InfoField
                  label="Vendor Type"
                  value={(
                    (vendor as any).vendor_type_display ||
                    vendor.vendor_type ||
                    "—"
                  ).replace(/^./, (char: string) => char.toUpperCase())}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                />
                {/* <InfoField
                label="Payment Term"
                value={
                  (vendor as any).payment_term_details?.name ||
                  ((vendor as any).payment_term
                    ? `Term #${(vendor as any).payment_term}`
                    : "—")
                }
              /> */}
                <InfoField
                  label="Created"
                  value={
                    (vendor as any).created_on
                      ? new Date((vendor as any).created_on).toLocaleString(
                          "en-NG",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "—"
                  }
                />
                <InfoField
                  label="Last Updated"
                  value={
                    (vendor as any).updated_on
                      ? new Date((vendor as any).updated_on).toLocaleString(
                          "en-NG",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "—"
                  }
                />
              </div>
            </div>

            {/* ── Bank Account card (PRD §9.8) ─────────────────────────────── */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vendor Bank Account
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Confirmed status badge */}
                  {hasBankDetails && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        isBankConfirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isBankConfirmed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Not confirmed
                        </>
                      )}
                    </span>
                  )}

                  <PermissionGuard
                    module="invoice"
                    entitlement="configure_invoice"
                  >
                    <button
                      type="button"
                      onClick={() => setIsBankModalOpen(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {hasBankDetails ? "Update details" : "Add bank details"}
                    </button>
                  </PermissionGuard>
                </div>
              </div>

              {/* Warning when bank exists but is not confirmed */}
              {hasBankDetails && !isBankConfirmed && (
                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-start">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">
                      Bank details are not confirmed
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      Payments to this vendor will be blocked until the bank
                      account is confirmed.
                    </p>
                  </div>
                  <PermissionGuard
                    module="invoice"
                    entitlement="configure_invoice"
                  >
                    <Button
                      variant="contained"
                      size="sm"
                      onClick={handleConfirmBank}
                      disabled={isConfirming}
                      className="shrink-0 self-start"
                    >
                      {isConfirming ? "Confirming…" : "Confirm Bank Account"}
                    </Button>
                  </PermissionGuard>
                </div>
              )}

              {hasBankDetails ? (
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <InfoField
                    label="Bank Account Name"
                    value={
                      <TruncateWithTooltip
                        value={bankAccount.bank_account_name}
                        maxLength={40}
                      />
                    }
                  />
                  <InfoField
                    label="Bank Account Number"
                    value={bankAccount.bank_account_number || "—"}
                  />
                  <InfoField
                    label="Bank Name"
                    value={bankAccount.bank_name || "—"}
                  />
                  <InfoField
                    label="Branch / Sort Code"
                    value={bankAccount.branch_code || "—"}
                  />
                  {bankAccount.updated_at && (
                    <InfoField
                      label="Bank Details Updated"
                      value={new Date(bankAccount.updated_at).toLocaleString(
                        "en-NG",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-medium text-gray-700">
                    No bank account details
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Add bank details and confirm them before any payment can be
                    processed to this vendor.
                  </p>
                  <PermissionGuard
                    module="invoice"
                    entitlement="configure_invoice"
                  >
                    <button
                      type="button"
                      onClick={() => setIsBankModalOpen(true)}
                      className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Add bank details
                    </button>
                  </PermissionGuard>
                </div>
              )}

              {/* Secondary confirm button at bottom when not confirmed */}
              {hasBankDetails && !isBankConfirmed && (
                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                  <PermissionGuard
                    module="invoice"
                    entitlement="configure_invoice"
                  >
                    <Button
                      variant="contained"
                      onClick={handleConfirmBank}
                      disabled={isConfirming}
                      className="inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isConfirming ? "Confirming…" : "Confirm Bank Account"}
                    </Button>
                  </PermissionGuard>
                </div>
              )}
            </div>

            {/* Bank details modal */}
            <UpdateBankDetailsModal
              isOpen={isBankModalOpen}
              onClose={() => setIsBankModalOpen(false)}
              vendorId={vendorId}
              onSuccess={() => refetch()}
              initialData={{
                accountName: bankAccount?.bank_account_name || "",
                accountNumber: bankAccount?.bank_account_number || "",
                bankName: bankAccount?.bank_name || "",
                branch: bankAccount?.branch_code || "",
              }}
            />
          </>
        )}
      </div>
    </PageGuard>
  );
}
