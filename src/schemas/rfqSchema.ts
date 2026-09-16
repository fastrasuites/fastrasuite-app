import { z } from "zod";

export const rfqSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  vendor: z.string().min(1, "Vendor is required"),
  purpose: z.string().min(1, "Purpose is required"),
  requesting_location: z.string().min(1, "Requesting location is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  purchase_request: z.string().min(1, "Purchase request is required"),
});

export type RfqFormData = z.infer<typeof rfqSchema>;

export interface LineItem {
  id: string;
  product: string;
  qty: number;
  estimated_unit_price: string;
  product_description?: string;
  unit_of_measure?: string;
}
