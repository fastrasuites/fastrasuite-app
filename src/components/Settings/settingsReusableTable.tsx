"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import clsx from "clsx";
import userAvatar from "../../../../public/images/userAvatar.png"; // import user avatar

interface Header {
  key: string;
  label: string;
}

interface TableProps {
  headers: Header[];
  data: any[];
  checkbox?: boolean;
  bordered?: boolean;
  rounded?: boolean;
  striped?: boolean;
  hover?: boolean;
  className?: string;
  headerTextColor?: string;
  bodyTextColor?: string;
  headerClassName?: string;
  icon?: React.ReactNode;
  iconWrapperClassName?: string;
  type?: "user" | "company";
  renderCell?: (row: any, key: string) => React.ReactNode;
  showStatusColumn?: boolean; // NEW
  onRowClick?: (row: any) => void;
  clickKey?: string; // optional key to use instead of id
}

export const ReusableTable: React.FC<TableProps> = ({
  headers,
  data,
  checkbox = false,
  bordered = true,
  rounded = true,
  striped = false,
  hover = true,
  headerClassName,
  className = "",
  headerTextColor = "",
  bodyTextColor = "",
  icon,
  iconWrapperClassName,
  type = "company",
  showStatusColumn = false, // default false
  onRowClick,
  renderCell,
  clickKey,
}) => {
  return (
    <div
      className={clsx(
        "w-full overflow-y-auto",
        rounded && "rounded-lg",
        bordered && "border border-[#E2E6E9]",
        className,
      )}
      style={{ maxHeight: "500px" }}
    >
      <table className="w-full border-collapse">
        <thead className={clsx(headerClassName)}>
          <tr className="text-left">
            {/* {checkbox && (
              <th className="p-3 w-10 rounded-tl-lg rounded-bl-lg bg-inherit">
                <Checkbox
                  defaultChecked={false}
                  className="bg-white border-[#E2E6E9] ..."
                />
              </th>
            )} */}
            {headers.map((h, index) => {
              const isLast = index === headers.length - 1 && !showStatusColumn;
              return (
                <th
                  key={h.key}
                  className={clsx(
                    "p-3 font-semibold text-sm",
                    isLast && "rounded-tr-lg rounded-br-lg bg-inherit",
                    headerTextColor,
                  )}
                >
                  {h.label}
                </th>
              );
            })}
            {showStatusColumn && (
              <th
                className={clsx(
                  "p-3 font-semibold text-sm rounded-tr-lg rounded-br-lg",
                  headerTextColor,
                )}
              >
                Status
              </th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white">
          {data.map((row, index) => {
            const valueToPass = clickKey ? row[clickKey] : row.id;

            return (
              <tr
                key={row.id ?? index}
                className={clsx(
                  striped && index % 2 === 1 && "bg-gray-50",
                  "cursor-pointer",
                  hover && "hover:bg-gray-100",
                )}
                onClick={() => onRowClick?.(valueToPass)}
              >
                {/* {checkbox && (
                  <td className="p-3 w-10 border-b border-[#E2E6E9]">
                    <Checkbox
                      defaultChecked={false}
                      className="bg-white border-[#E2E6E9] ..."
                    />
                  </td>
                )} */}

                {headers.map((h) => (
                  <td
                    key={h.key}
                    className={`p-3 text-sm border-b border-[#E2E6E9] ${bodyTextColor}`}
                  >
                    {renderCell ? renderCell(row, h.key) : (row[h.key] ?? "—")}
                  </td>
                ))}

                {showStatusColumn && (
                  <td
                    className={`p-3 text-sm border-b border-[#E2E6E9] ${bodyTextColor}`}
                  >
                    <span
                      className={clsx(
                        "px-4 py-1 rounded-full #FFF2CC text-xs font-semibold",
                        row.status === "archived"
                          ? "bg-[#FFF2CC] text-[#F0B401] bold"
                          : "bg-green-500",
                      )}
                    >
                      {row.status ?? "—"}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
