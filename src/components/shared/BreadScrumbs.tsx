"use client";

import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export type BreadcrumbItem = {
  label: string;
  href?: string; // if omitted, the item will render as plain text
  current?: boolean; // sets aria-current on the item
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  action?: React.ReactNode; // optional action shown at the far right (e.g. autosave button)
};

export default function Breadcrumbs({
  items,
  className = "",
  separator,
  action,
}: Props) {
  const sep = separator ?? <ChevronRight size={18} className="text-gray-400" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
    >
      <nav className={` px-6 ${className}`} aria-label="Breadcrumb">
        <ol className="text-sm text-gray-500 flex items-center gap-2">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;

            return (
              <li key={idx} className="flex items-center gap-2">
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    className="hover:underline text-gray-500"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`${
                      isLast ? "text-gray-700 font-medium" : "text-gray-500"
                    }`}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}

                {!isLast && <span className="flex items-center">{sep}</span>}
              </li>
            );
          })}

          {action && <div className="ml-auto">{action}</div>}
        </ol>
      </nav>
    </motion.div>
  );
}
