"use client";

import React from "react";

type IconProps = {
  className?: string;
  fill?: string; // dynamic color
};

export const ListViewIcon = ({ className, fill = "#A9B3BC" }: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 4.16666C2.5 3.70643 2.8731 3.33333 3.33333 3.33333H16.6667C17.1269 3.33333 17.5 3.70643 17.5 4.16666C17.5 4.6269 17.1269 4.99999 16.6667 4.99999H3.33333C2.8731 4.99999 2.5 4.62689 2.5 4.16666Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 10C2.5 9.53976 2.8731 9.16667 3.33333 9.16667H16.6667C17.1269 9.16667 17.5 9.53976 17.5 10C17.5 10.4603 17.1269 10.8333 16.6667 10.8333H3.33333C2.8731 10.8333 2.5 10.4603 2.5 10Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 15.8333C2.5 15.3731 2.8731 15 3.33333 15H16.6667C17.1269 15 17.5 15.3731 17.5 15.8333C17.5 16.2936 17.1269 16.6667 16.6667 16.6667H3.33333C2.8731 16.6667 2.5 16.2936 2.5 15.8333Z"
      fill={fill}
    />
  </svg>
);
