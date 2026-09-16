import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchBar({
  placeholder = "Search",
  className = "",
  value,
  onChange,
}: SearchBarProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-200" />
      <Input
        id="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 py-5 rounded-md border-gray-200 focus:border-[#4169FF] focus:ring-[rgba(65,105,255,0.12)] max-w-sm transition-all duration-200"
      />
    </motion.div>
  );
}
