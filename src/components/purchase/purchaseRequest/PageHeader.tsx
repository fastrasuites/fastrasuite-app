"use client";

import React from "react";
import { motion } from "framer-motion";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { AutoSaveIcon } from "@/components/shared/icons";
import { BreadcrumbItem } from "@/types/purchase";
import AnimatedWrapper, { FadeIn } from "@/components/shared/AnimatedWrapper";
import Link from "next/link";

interface PageHeaderProps {
  items: BreadcrumbItem[];
  title: string;
  isEdit?: string;
}

export function PageHeader({ items, title, isEdit }: PageHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Header */}

      <Breadcrumbs
        items={items}
        action={
          <Button
            variant="ghost"
            className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
          >
            Autosaved <AutoSaveIcon />
          </Button>
        }
      />

      <motion.div
        className="bg-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
      >
        <div className="h-16 border-b border-gray-200 flex justify-between items-center px-6">
          <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
            <Button
              aria-label="Go back"
              onClick={() => router.back()}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded cursor-pointer border-none hover:border-none hover:bg-transparent transition-all duration-200"
            >
              <motion.div whileHover={{ x: -2 }} transition={{ duration: 0.2 }}>
                <MoveLeft size={20} />
              </motion.div>
              <span className="text-base font-medium">{title}</span>
            </Button>
          </motion.div>

          {isEdit ? (
            <FadeIn delay={0.8}>
              <AnimatedWrapper
                animation="scaleIn"
                delay={0.9}
                hoverEffect={true}
                className="inline-flex"
              >
                <Link href={isEdit}>
                  <Button
                    variant={"ghost"}
                    className="px-6 py-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Button>
                </Link>
              </AnimatedWrapper>
            </FadeIn>
          ) : null}
        </div>
      </motion.div>
    </>
  );
}
