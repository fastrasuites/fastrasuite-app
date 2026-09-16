// components/form/FormSection.tsx
import React from "react";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection = ({ title, children, className = "" }: SectionProps) => {
  return (
    <div className={`p-4 bg-white border ${className}`}>
      {title && <h2 className="text-base font-semibold text-[#3B7CED]">{title}</h2>}
      {children}
    </div>
  );
};

export default FormSection;
