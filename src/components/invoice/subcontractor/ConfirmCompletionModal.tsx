"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  User,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ConfirmCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  milestoneName: string;
  formatCurrency: (amount: number) => string;
}

export default function ConfirmCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  milestoneName,
  formatCurrency,
}: ConfirmCompletionModalProps) {
  const [completionNote, setCompletionNote] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!completionNote.trim()) {
      alert("Please enter a completion note");
      return;
    }
    setIsSuccess(true);
    setTimeout(() => {
      onConfirm(completionNote);
      setIsSuccess(false);
      setCompletionNote("");
    }, 1500);
  };

  if (isSuccess) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

        {/* Success Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Successful
              </h3>
              <p className="text-sm text-gray-500">
                Milestone has successfully been marked as completed
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Completion
            </h2>
            <button
              type="button"
              aria-label="close modal"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-sm text-gray-500 mb-6">Fill appropriately</p>

            {/* Project Manager Name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">
                Project Manager Name
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">
                Timestamp
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Completion Note */}
            <div>
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">
                Completion Note
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
