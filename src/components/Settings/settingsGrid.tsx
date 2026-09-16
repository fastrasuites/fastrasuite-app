"use client";

import React from "react";
import { SettingsCard } from "./settingsCard";
import userAvatar from "../../../public/images/userAvatar.png";
import { useSelector } from "react-redux";

type Entity = {
  id: string | number;
  name: string;
  [key: string]: any;
};

type SettingsGridProps = {
  dataList: Entity[];
  fieldsToShow: string[];
  icon: React.ReactNode;                     // icon for non-user types
  type: "user" | "company";                  // page type
  onItemClick?: (id: string | number) => void;
  clickKey?: string; 
};

export const SettingsGrid = ({
  dataList,
  fieldsToShow,
  icon,
  type,
  onItemClick,
  clickKey,
}: SettingsGridProps) => {


  const tenant_company_name = useSelector(
      (state: any) => state.auth.tenant_company_name
    );

    
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
      {dataList.map((item) => {
        const finalIcon =
          type === "user" ? (
            <img
              src={userAvatar.src}   // important: .src for Next.js imported image
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
            />
          ) : (
            icon
          );


        const valueToPass = clickKey ? item[clickKey] : item.id;
        return (
          <SettingsCard
            key={item.id}
            icon={finalIcon}
            title={item.name}
            data={fieldsToShow.map((field) => item[field])}
             onClick={() => onItemClick?.(valueToPass)}
          />
        );
      })}
    </div>
  );
};
