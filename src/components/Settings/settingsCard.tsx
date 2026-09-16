"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SettingsCardProps = {
  icon: React.ReactNode;
  title: string;           
  data: (string | number)[]; 
  className?: string;
  onClick?: () => void;
};

export const SettingsCard = ({ icon, title, data, className, onClick }: SettingsCardProps) => {
  const isImage = React.isValidElement(icon) && icon.type === 'img';

  return (
    <div
      className={cn(
        "flex flex-col bg-white border border-[#E2E6E9] rounded-sm p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow duration-200",
        className
      )}
      onClick={onClick}
    >
      {/* Icon + Title */}
      <div className="flex flex-col items-center gap-3 mb-3">
        <div className={`w-20 h-20 rounded-full ${isImage ? "bg-[#C8F1FF]" : "bg-[#E8EFFD]" }  flex items-center justify-center overflow-hidden`}>
          {isImage ? (
            <img
              src={(icon as any).props.src} // the image src from JSX
              alt={(icon as any).props.alt || "avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            icon
          )}
        </div>
        <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
      </div>

      {/* Additional Info */}
      <div className="flex flex-col items-center gap-2 text-[#7A8A98] text-base">
        {data.map((item, idx) => (
          <span key={idx}>{item}</span>
        ))}
      </div>
    </div>
  );
};
