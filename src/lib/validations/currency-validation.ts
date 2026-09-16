import { z } from "zod";

export const currencyCreateSchema = z.object({
  currency_name: z
    .string()
    .min(1, "Currency name is required")
    .max(100, "Currency name must not exceed 100 characters"),
  currency_code: z
    .string()
    .min(1, "Currency code is required")
    .length(3, "Currency code must be exactly 3 characters")
    .toUpperCase(),
  currency_symbol: z
    .string()
    .min(1, "Currency symbol is required")
    .max(10, "Currency symbol must not exceed 10 characters"),
});

export type CurrencyCreateInput = z.infer<typeof currencyCreateSchema>;

export const unitOfMeasureSchema = z.object({
  unit_name: z
    .string()
    .min(1, "Unit name is required")
    .max(100, "Unit name must not exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      "Unit name can only contain letters, numbers, spaces, hyphens, underscores, and dots"
    ),
  unit_symbol: z
    .string()
    .min(1, "Unit symbol is required")
    .max(20, "Unit symbol must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_\.\/]+$/,
      "Unit symbol can only contain letters, numbers, spaces, hyphens, underscores, dots, and slashes"
    ),
  unit_category: z
    .string()
    .min(1, "Unit category is required")
    .max(50, "Unit category must not exceed 50 characters")
    .regex(
      /^[a-zA-Z\s\-_]+$/,
      "Unit category can only contain letters, spaces, hyphens, and underscores"
    ),
});

export type UnitOfMeasureInput = z.infer<typeof unitOfMeasureSchema>;
