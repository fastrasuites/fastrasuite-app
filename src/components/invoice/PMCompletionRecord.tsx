// "use client";

import { CheckCircle } from "lucide-react";

const PMCompletionRecord = () => {
  return (
    <div className="bg-white rounded border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="rounded flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900">
          PM Completion Record
        </h1>
      </div>

      {/* Info Grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-16">
        <div>
          <p className="text-sm text-gray-500 font-medium">Confirmed By</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">S. Okwu</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Timestamp</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            2026-06-25 19:27
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">
          PM Completion Record
        </p>
        <div className="">
          <p className="text-[15.5px] leading-relaxed">
            “Site clearing completed to satisfaction. Survey certificate
            received from Samples &amp; Assoc. dated 05 April 2024.”
          </p>
        </div>
      </div>
    </div>
  );
};

export default PMCompletionRecord;
