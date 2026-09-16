// components/form/FormInput.tsx
import React from "react";

interface FormInputProps {
  label?: string;
  name: string;
  value?: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean; // ✅ optional prop
  error?: string;
}

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
  required = false, // default to false
  error,
}: FormInputProps) => {
  const isTextArea = type === "textarea";
  const borderClass = error ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-[#7A8A98]";

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-[#1A1A1A] font-medium mb-1">{label}</label>}

      {isTextArea ? (
        <textarea
          name={name}
          value={value as string}
          onChange={onChange}
          placeholder={placeholder}
          required={required} // ✅ apply required
          className={`border rounded-lg p-3 text-[#7A8A98] ${borderClass} ${className}`}
        />
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          name={name}
          checked={value as boolean}
          onChange={onChange}
          className={`h-5 w-5 ${className}`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value as string | number}
          onChange={onChange}
          placeholder={placeholder}
          required={required} // ✅ apply required
          className={`border text-[#1A1A1A] rounded-xs p-2 text-sm ${borderClass} ${className}`}
        />
      )}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};

export default FormInput;
