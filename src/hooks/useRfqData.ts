import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import {
  useGetRequestForQuotationQuery,
  usePatchRequestForQuotationMutation,
} from "@/api/purchase/requestForQuotationApi";
import { RequestForQuotation } from "@/api/purchase/requestForQuotationApi";

export interface UseRfqDataReturn {
  rfq: RequestForQuotation | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  isUpdatingStatus: boolean;
  updateStatus: (status: "approved" | "rejected" | "pending") => Promise<void>;
}

export function useRfqData(rfqId: string): UseRfqDataReturn {
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserId = loggedInUser?.id;

  const {
    data: rfq,
    isLoading,
    error,
    refetch,
  } = useGetRequestForQuotationQuery(rfqId);

  const [updateStatusMutation, { isLoading: isUpdatingStatus }] =
    usePatchRequestForQuotationMutation();

  const updateStatus = async (
    status: "approved" | "rejected" | "pending"
  ): Promise<void> => {
    try {
      await updateStatusMutation({
        id: rfqId,
        data: { status },
      }).unwrap();

      await refetch();
    } catch (error) {
      console.error("Failed to update RFQ status:", error);
      throw error;
    }
  };

  return {
    rfq,
    isLoading,
    error,
    refetch,
    isUpdatingStatus,
    updateStatus,
  };
}
