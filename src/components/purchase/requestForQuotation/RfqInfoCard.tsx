"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
} from "@/components/shared/AnimatedWrapper";
import type { Status } from "../types";

interface RfqInfoCardProps {
  status: Status;
  loggedInUser: {
    username?: string;
  } | null;
}

export function RfqInfoCard({ status, loggedInUser }: RfqInfoCardProps) {
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
    >
      <div className="py-2 mb-6 border-b border-gray-200">
        <StaggerContainer
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4"
          staggerDelay={0.15}
        >
          {/* Date */}
          <FadeIn>
            <div className="p-4 transition-colors border-r border-gray-300">
              <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                Date
              </h3>
              <p className="text-gray-700">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </FadeIn>

          {/* Requester */}
          <FadeIn>
            <div className="p-4 transition-colors border-r border-gray-300">
              <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                Requester
              </h3>
              <p className="text-gray-700">
                {loggedInUser?.username || "User"}
              </p>
            </div>
          </FadeIn>

          {/* Status */}
          <FadeIn>
            <div className="p-4 transition-colors border-r border-gray-300">
              <h3 className="text-base font-semibold text-[#3B7CED] mb-2">
                Status
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  status
                )}`}
              >
                {status?.toUpperCase() || "UNKNOWN"}
              </span>
            </div>
          </FadeIn>
        </StaggerContainer>
      </div>
    </motion.div>
  );
}
