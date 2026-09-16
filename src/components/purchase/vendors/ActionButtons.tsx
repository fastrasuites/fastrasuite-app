import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface ActionButtonsProps {
  href: string;
}

export function ActionButtons({ href }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        <Link href={href}>
          <Button
            variant="default"
            className="flex items-center gap-2 bg-[#3B7CED] hover:bg-[#3B7CED]/90 text-white shadow-sm transition-all duration-200"
          >
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <PlusCircle className="w-4 h-4" />
            </motion.div>
            New Vendors
          </Button>
        </Link>
      </motion.div>

      <motion.div
        className="hidden md:inline-flex"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="outline"
          className="border-[#3B7CED] text-[#3B7CED] hover:text-[#3B7CED] hover:bg-[#F0F4FF] transition-all duration-200"
        >
          Import Vendors
        </Button>
      </motion.div>
    </div>
  );
}
