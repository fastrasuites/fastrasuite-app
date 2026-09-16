"use client";

import React from "react";

type IconProps = {
  className?: string;
  fill?: string;
};

export const GridViewIcon = ({ className, fill = "#A9B3BC" }: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Top-left */}
    <rect x="1" y="1" width="8" height="8" rx="3" fill={fill} />
    {/* Top-right */}
    <rect x="11" y="1" width="8" height="8" rx="3" fill={fill} />
    {/* Bottom-left */}
    <rect x="1" y="11" width="8" height="8" rx="3" fill={fill} />
    {/* Bottom-right */}
    <rect x="11" y="11" width="8" height="8" rx="3" fill={fill} />
  </svg>
);
