"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./utils";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "outline" | "neutral" | "ghost-danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:border-blue-300",
  outline:
    "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 disabled:border-gray-200 disabled:text-gray-400",
  neutral:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200",
  "ghost-danger": "text-red-600 hover:bg-red-50 border border-transparent",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Text input                                                          */
/* ------------------------------------------------------------------ */

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500",
          className,
        )}
        {...props}
      />
    );
  },
);

export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-sm font-semibold text-gray-900",
        className,
      )}
    >
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Select (radix)                                                      */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | null;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
  /** Ref to the trigger button – lets a parent open the dropdown
   *  programmatically (e.g. a "Change" action button in a table row). */
  triggerRef?: React.Ref<HTMLButtonElement>;
  /** Native tooltip on the trigger (e.g. "endpoint pending" hints). */
  title?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled,
  loading,
  className,
  id,
  triggerRef,
  title,
}: SelectProps) {
  const selected = options.find((o) => o.value === value) ?? null;
  return (
    <SelectPrimitive.Root
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        ref={triggerRef}
        id={id}
        title={title}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          selected ? "text-gray-900" : "text-gray-400",
          className,
        )}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <SelectPrimitive.Icon asChild>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <ChevronDown
              className="h-4 w-4 shrink-0 text-gray-500"
              aria-hidden
            />
          )}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">
                No options available
              </p>
            ) : (
              options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm text-gray-900 outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-blue-600" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Pill (status badge)                                                 */
/* ------------------------------------------------------------------ */

export type PillVariant =
  | "success"
  | "danger"
  | "danger-outline"
  | "info"
  | "neutral"
  | "gray";

const pillVariants: Record<PillVariant, string> = {
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-600",
  "danger-outline": "border border-red-300 bg-white text-red-600",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
  gray: "bg-gray-100 text-gray-500",
};

export function Pill({
  variant = "neutral",
  className,
  children,
}: {
  variant?: PillVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        pillVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Banner                                                              */
/* ------------------------------------------------------------------ */

export type BannerVariant = "success" | "error" | "info";

const bannerVariants: Record<BannerVariant, string> = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  info: "border-blue-200 bg-blue-50",
};

export function Banner({
  variant = "info",
  title,
  children,
  action,
  className,
}: {
  variant?: BannerVariant;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border p-4",
        bannerVariants[variant],
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-gray-900">{title}</p>
        {children ? (
          <p className="mt-1 text-sm leading-5 text-gray-600">{children}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search input                                                        */
/* ------------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter pills (All 7 / Not mapped 3 / ...)                           */
/* ------------------------------------------------------------------ */

export function FilterPill({
  active,
  count,
  children,
  onClick,
}: {
  active?: boolean;
  count?: number;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-blue-600 bg-white text-blue-600"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50",
      )}
    >
      {children}
      {typeof count === "number" ? (
        <span
          className={cn(
            "font-semibold",
            active ? "text-blue-600" : "text-gray-500",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Spinner + skeleton                                                  */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-blue-600", className)}
      aria-label="Loading"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  );
}

/* ------------------------------------------------------------------ */
/* Page header (blue title + gray subtitle, as on every step screen)   */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-blue-600">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
