"use client";

import React from "react";
import Select, { MultiValue } from "react-select";

interface Option {
  label: string;
  value: string | number;
}

interface FormMultiSelectProps {
  label: string;
  name: string;
  value: string[]; // array for multiple selection
  placeholder?: string;
  options: Option[];
  onChange: (selected: string[]) => void;
}

export default function FormMultiSelect({
  label,
  name,
  value,
  placeholder = "Select...",
  options,
  onChange,
}: FormMultiSelectProps) {
  // react-select expects the selected values as objects
  const selectedOptions = options.filter((opt) => value.includes(opt.value.toString()));


  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <Select
        options={options}
        value={selectedOptions}
        isMulti
        placeholder={placeholder}
        onChange={(selected: MultiValue<Option>) => {
          onChange(selected.map((s) => s.value.toString()));
        }}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: "#3B7CED",
            boxShadow: "none",
            "&:hover": { borderColor: "#3B7CED" },
            minHeight: "44px",
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: "#3B7CED",
            color: "white",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: "white",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: "white",
            ":hover": {
              backgroundColor: "#2356A5",
              color: "white",
            },
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "#3B7CED"
              : state.isFocused
              ? "#E6F0FF"
              : "white",
            color: state.isSelected ? "white" : "#1A1A1A",
            ":active": {
              backgroundColor: "#3B7CED",
              color: "white",
            },
          }),
        }}
      />
    </div>
  );
}
