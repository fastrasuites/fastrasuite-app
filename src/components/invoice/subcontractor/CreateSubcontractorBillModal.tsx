"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  File,
  Trash2,
  ChevronRight,
  User,
  Building,
  CreditCard,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface Milestone {
  id: number;
  name: string;
  status: string;
  description: string;
  amount: number;
}

interface CreateSubcontractorBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  subcontractorName: string;
  wbs: string;
  costCategory: string;
  milestone: Milestone | null;
  formatCurrency: (amount: number) => string;
}

export default function CreateSubcontractorBillModal({
  isOpen,
  onClose,
  poId,
  subcontractorName,
  wbs,
  costCategory,
  milestone,
  formatCurrency,
}: CreateSubcontractorBillModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [invoiceValue, setInvoiceValue] = useState<number>(
    milestone?.amount || 0,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !milestone) return null;

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!uploadedFile) {
      alert("Please upload the subcontractor invoice document");
      return;
    }
    if (!invoiceValue || invoiceValue <= 0) {
      alert("Please enter a valid invoice value");
      return;
    }
    alert("Subcontractor bill submitted successfully!");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Create Vendor Bill
              </h1>
              <h2 className="text-xl font-semibold text-gray-900">PO-{poId}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Originating Request: REQ-2024-0041
              </p>
            </div>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Vendor Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Vendor
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {subcontractorName}
                </p>
              </div>
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  WBS element
                </p>
                <p className="text-sm font-medium text-gray-900">{wbs}</p>
              </div>
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Cost Category
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {costCategory}
                </p>
              </div>
            </div>

            {/* Bank Account Info */}
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Recipients Bank Account
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {subcontractorName}
                </p>
              </div>
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Bank Account Number
                </p>
                <p className="text-sm font-medium text-gray-900">4372517821</p>
              </div>
              <div className="rounded px-4 py-3 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Bank
                </p>
                <p className="text-sm font-medium text-gray-900">GT Bank</p>
              </div>
            </div>

            {/* PM Completion Record */}
            <div className="bg-green-50 text-green-600 rounded-md p-4 border border-green-200 mb-6">
              <p className="text-xs text-g-500 uppercase tracking-wider mb-2">
                PM Completion Record
              </p>
              <p className="text-xs text-gray-600 mb-1">
                J. Doe · 2024-04-08 09:14
              </p>
              <p className="text-sm text-gray-700 italic">
                "Site clearing completed to satisfaction. Survey certificate
                received from Samples & Assoc. dated 05 April 2024."
              </p>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Upload Subcontractor Invoice Document
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                PDF or image required. Stored permanently as audit evidence
                against this invoice record.
              </p>

              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Drop your invoice document here
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF, PNG, JPG up to 20 MB
                  </p>
                  <input
                    aria-label="upload-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <File className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Remove File"
                    onClick={removeFile}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Price Confirmation */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Price Confirmation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Milestone Value
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(milestone.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Invoice Value
                  </label>
                  <input
                    type="number"
                    value={invoiceValue}
                    onChange={(e) => setInvoiceValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    placeholder="Enter invoice value"
                  />
                </div>
              </div>
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
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              Submit Vendor Bill
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
