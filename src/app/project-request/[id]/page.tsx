"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetProjectRequestQuery } from "@/api/requests/projectRequestApi";
import { Loader2 } from "lucide-react";

export default function ProjectRequestDynamicRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = typeof params?.id === "string" ? params.id : "";
  const numericId = Number(idStr);

  const { data: request, isLoading, isError } = useGetProjectRequestQuery(numericId, {
    skip: !idStr || isNaN(numericId),
  });

  useEffect(() => {
    if (!idStr || isNaN(numericId)) {
      router.replace("/project-request/approve");
      return;
    }

    if (isError) {
      // Fallback to the approve list or generic detail
      router.replace(`/project-request/approve/${numericId}`);
      return;
    }

    if (request) {
      const type = (request.request_type || "").toLowerCase();
      const status = (request.status || "").toLowerCase();
      const detailId = (request as any).detail?.id;

      // If already pending or approved, the approve page is the primary view
      if (status === "pending" || status === "approved") {
        router.replace(`/project-request/approve/${numericId}`);
        return;
      }

      // Otherwise direct to the respective sub-module page
      if (type.includes("purchase")) {
        router.replace(`/project-request/purchase-request/${detailId || numericId}`);
      } else if (type.includes("subcontractor")) {
        router.replace(`/project-request/subcontractor-request/${detailId || numericId}`);
      } else if (type.includes("labour")) {
        router.replace(`/project-request/labour-request/${numericId}`);
      } else if (type.includes("petty")) {
        router.replace(`/project-request/petty-cash-request/${numericId}`);
      } else if (type.includes("material")) {
        router.replace(`/project-request/material-consumption-request/${detailId || numericId}`);
      } else {
        router.replace(`/project-request/approve/${numericId}`);
      }
    }
  }, [request, isError, idStr, numericId, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#3B7CED]" />
      <p className="text-sm font-medium text-gray-500">Redirecting to request...</p>
    </div>
  );
}
