"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { useGetPaymentTermsQuery, PaymentTerm } from "@/api/invoice/paymentTermsApi";
interface PaymentTermsSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PaymentTermsSelect({
  value,
  onChange,
  placeholder = "Select payment terms",
  className = "",
}: PaymentTermsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: apiData } = useGetPaymentTermsQuery({});
  const paymentTermsList: PaymentTerm[] = Array.isArray(apiData) ? apiData : (apiData as any)?.results || [];
  const [filteredTerms, setFilteredTerms] = useState<PaymentTerm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter payment terms based on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTerms(paymentTermsList);
    } else {
      const filtered = paymentTermsList.filter((term) =>
        term.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredTerms(filtered);
    }
  }, [searchTerm, paymentTermsList]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  const handleSelect = (termId: string) => {
    onChange(termId);
    setIsOpen(false);
    setIsModalOpen(false);
    setSearchTerm("");
  };

  const handleSearchMore = () => {
    setIsOpen(false);
    setIsModalOpen(true);
    setSearchTerm("");
  };

  const displayedTerms = isOpen ? filteredTerms : [];

  const selectedTermObj = paymentTermsList.find((t) => t.id.toString() === value);
  const displayValue = selectedTermObj ? selectedTermObj.name : value;

  return (
    <>
      {/* Dropdown */}
      <div ref={dropdownRef} className={`relative ${className}`}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer flex items-center justify-between hover:border-gray-300 transition-colors"
        >
          <span
            className={
              !selectedTermObj ? "text-gray-400" : "text-gray-900"
            }
          >
            {displayValue || placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search Bar */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payment terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  autoFocus
                />
              </div>
            </div>

            {/* Terms List */}
            <div className="overflow-y-auto max-h-48">
              {displayedTerms.length > 0 ? (
                displayedTerms.map((term) => (
                  <div
                    key={term.id}
                    onClick={() => handleSelect(term.id.toString())}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 cursor-pointer transition-colors ${
                      value === term.id.toString()
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {term.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No payment terms found
                </div>
              )}
            </div>

            {/* Search More Button */}
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={handleSearchMore}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                Search More...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for all payment terms */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              ref={modalRef}
              className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Terms
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payment terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    autoFocus
                  />
                </div>
              </div>

              {/* Modal Terms List */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((term) => (
                    <div
                      key={term.id}
                      onClick={() => handleSelect(term.id.toString())}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group rounded-lg ${
                        value === term.id.toString() ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className={`text-sm font-medium ${value === term.id.toString() ? "text-blue-600" : "text-gray-700"}`}>
                        {term.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-sm text-gray-500 text-center">
                    No payment terms found
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
