import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PurchaseRequestFormActionsProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  submitText?: string;
  isLoading?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSendForApproval?: () => void;
  isLoadingStatus?: boolean;
}

export function PurchaseRequestFormActions({
  onSubmit,
  submitText = "Create Purchase Request",
  isLoading = false,
  formRef,
  onSendForApproval,
  isLoadingStatus = false,
}: PurchaseRequestFormActionsProps) {
  const handleClick = () => {
    if (formRef?.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <>
      {/* Spacer area to mimic design whitespace */}
      <div className="h-28" />

      {/* Bottom action area - fixed to bottom right */}
      <motion.div
        className="flex justify-end gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      >
        {/* Send for Approval Button */}
        {onSendForApproval && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="outline"
              type="button"
              disabled={isLoadingStatus || isLoading}
              className="transition-all duration-200 border-blue-500 text-blue-500 hover:bg-blue-50"
              onClick={onSendForApproval}
            >
              {isLoadingStatus
                ? "Sending for Approval..."
                : "Send for Approval"}
            </Button>
          </motion.div>
        )}

        {/* Update Purchase Request Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            variant={"contained"}
            type="submit"
            disabled={isLoading || isLoadingStatus}
            className="transition-all duration-200"
            onClick={onSubmit ? handleClick : undefined}
          >
            {isLoading
              ? submitText.includes("...")
                ? submitText
                : "Loading..."
              : submitText}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
}
