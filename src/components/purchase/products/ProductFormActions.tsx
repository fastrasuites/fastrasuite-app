import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ProductFormActionsProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  submitText?: string;
  isLoading?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
}

export function ProductFormActions({
  onSubmit,
  submitText = "Create Product",
  isLoading = false,
  formRef,
}: ProductFormActionsProps) {
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
        className="flex justify-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            variant={"contained"}
            type="submit"
            disabled={isLoading}
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
