import React from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import type { IncomingProduct } from "@/types/incomingProduct";

interface IncomingProductCardsProps {
  incomingProducts: IncomingProduct[];
  query?: string;
}

interface IncomingProductCardProps {
  incomingProduct: IncomingProduct;
  index: number;
  query?: string;
}

function renderStatusBadge(status: string) {
  if (status === "validated") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E2F2E9] text-[#1E8E3E] min-w-[80px]">
        Validated
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] min-w-[80px]">
        Draft
      </span>
    );
  }
  if (status === "canceled") {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F] min-w-[80px]">
        Canceled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9ECEF] text-[#8898AA] min-w-[80px]">
      {status}
    </span>
  );
}

function IncomingProductCard({ incomingProduct, index }: IncomingProductCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(
      `/inventory/operation/incoming_product/${encodeURIComponent(incomingProduct.incoming_product_id)}`
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md hover:border-blue-200/80 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md tracking-wide truncate max-w-[120px]">
            {incomingProduct.incoming_product_id}
          </span>
          {renderStatusBadge(incomingProduct.status)}
        </div>
        <h3 className="text-sm font-bold text-[#32325D] group-hover:text-[#3B7CED] transition-colors line-clamp-1 mb-1 capitalize">
          {incomingProduct.receipt_type.replace(/_/g, " ")}
        </h3>
        <p className="text-xs text-[#8898AA] font-medium truncate">
          {incomingProduct.supplier_details?.company_name || "—"}
        </p>
      </div>

      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider mb-0.5">
            Source
          </span>
          <span className="font-medium text-[#525F7F] block truncate max-w-[110px]">
            {incomingProduct.source_location_details?.location_name || "N/A"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider mb-0.5">
            Destination
          </span>
          <span className="font-medium text-[#525F7F] block truncate max-w-[110px]">
            {incomingProduct.destination_location_details?.location_name || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function IncomingProductCards({
  incomingProducts,
  query = "",
}: IncomingProductCardsProps) {
  return (
    <div>
      {incomingProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {incomingProducts.map((incomingProduct, index) => (
            <IncomingProductCard
              key={incomingProduct.incoming_product_id}
              incomingProduct={incomingProduct}
              index={index}
              query={query}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
              <Package className="w-full h-full" />
            </div>
            <p className="text-[#8898AA] text-sm">No incoming products found</p>
          </div>
        </div>
      )}
    </div>
  );
}
