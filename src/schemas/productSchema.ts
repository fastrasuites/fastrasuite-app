import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Product description is required")
    .max(500, "Description must be less than 500 characters"),
  available: z.coerce
    .number()
    .min(0, "Available quantity must be 0 or greater"),
  totalPurchased: z.coerce
    .number()
    .min(0, "Total purchased must be 0 or greater"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit of measure is required"),
});

export type ProductFormData = z.infer<typeof productSchema>;
