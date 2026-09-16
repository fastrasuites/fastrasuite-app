"use client";

import { useState } from "react";
import { X, CalendarIcon, AlertCircle, Loader2 } from "lucide-react";

interface ReturnHiredEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (returnDate?: string) => Promise<void>;
  equipmentDescription: string;
  expectedReturnDate?: string;
  hireStatus: string;
  isReturning?: boolean;
}

export default function ReturnHiredEquipmentModal({
  isOpen,
  onClose,
  onConfirm,
  equipmentDescription,
  expectedReturnDate,
  hireStatus,
  isReturning = false,
}: ReturnHiredEquipmentModalProps) {
  const [returnDate, setReturnDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!returnDate) {
      setError("Please select a return date");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (returnDate < today) {
      setError("Return date cannot be in the past");
      return;
    }

    setError(null);
    try {
      await onConfirm(returnDate);
      setReturnDate("");
      onClose();
    } catch (err) {
      console.error("[Return Equipment]", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={isReturning ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-equipment-title"
          className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2
              id="return-equipment-title"
              className="text-xl font-semibold text-gray-900"
            >
              Return Hired Equipment
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={isReturning}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Equipment
              </p>
              <p className="text-sm font-medium text-gray-900">
                {equipmentDescription || "—"}
              </p>
            </div>

            {expectedReturnDate && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-amber-700 mb-1">
                  Expected Return Date
                </p>
                <p className="text-sm font-medium text-amber-900">
                  {new Date(expectedReturnDate).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {hireStatus === "overdue" && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">
                  This equipment is overdue. Please confirm the return date.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="return-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Return Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="return-date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    setError(null);
                  }}
                  disabled={isReturning}
                  className={`w-full rounded-lg border px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white disabled:opacity-60 ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              {error && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isReturning}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isReturning || !returnDate}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReturning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Marking Returned…
                </>
              ) : (
                "Confirm Return"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
