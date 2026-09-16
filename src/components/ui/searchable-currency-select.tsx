"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CurrencyOption {
  country: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

interface SearchableCurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: CurrencyOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableCurrencySelect({
  value,
  onValueChange,
  options,
  placeholder = "Select a currency",
  disabled = false,
  className,
}: SearchableCurrencySelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }

    const searchLower = searchTerm.toLowerCase();
    return options.filter((option) => {
      return (
        option.currencyCode.toLowerCase().includes(searchLower) ||
        option.currencyName.toLowerCase().includes(searchLower) ||
        option.country.toLowerCase().includes(searchLower) ||
        option.currencySymbol.toLowerCase().includes(searchLower)
      );
    });
  }, [options, searchTerm]);

  // Find the selected option
  const selectedOption = React.useMemo(() => {
    return options.find((option) => {
      const optionValue = `${option.country} ${option.currencyName} (${option.currencyCode})`;
      return optionValue === value;
    });
  }, [options, value]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onValueChange("");
    setSearchTerm("");
    setIsOpen(true); // Keep dropdown open after clearing
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm("");
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleSelect}
      onOpenChange={handleOpenChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)} size="md">
        <SelectValue placeholder={placeholder}>
          {selectedOption && (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">
                {selectedOption.country} {selectedOption.currencyName} (
                {selectedOption.currencyCode})
              </span>
              {selectedOption.currencySymbol && (
                <span className="text-sm text-gray-500 ml-2">
                  {selectedOption.currencySymbol}
                </span>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)] max-w-md">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8 pr-8"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {searchTerm ? "No currencies found" : "No currencies available"}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const optionValue = `${option.country} ${option.currencyName} (${option.currencyCode})`;
              return (
                <SelectItem
                  key={`${option.currencyCode}-${index}`}
                  value={optionValue}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{option.country}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.currencyName} ({option.currencyCode})
                      </span>
                    </div>
                    {option.currencySymbol && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {option.currencySymbol}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
