"use client";
import { FaChevronDown } from "react-icons/fa";

interface Option {
  label: string;
  value: string | number;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string | number;
  placeholder: string;
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

export default function FormSelect({
  label,
  name,
  value,
  placeholder,
  options,
  onChange,
  error,
}: FormSelectProps) {
  const borderClass = error
    ? "border-red-500 focus:border-red-500"
    : "border-[#7A8A98]";

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-sm font-medium text-[#1A1A1A]">{label}</label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full border ${borderClass} px-3 py-2 pr-10 bg-white text-[#1A1A1A] text-sm appearance-none rounded`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom arrow */}
        <FaChevronDown className="absolute right-3 top-1/2 text-sm transform -translate-y-1/2 text-[#7A8A98] pointer-events-none" />
      </div>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
