import { z } from "zod";

export const vendorSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  address_street: z.string().min(1, "Street address is required"),
  local_government: z.string().min(1, "Local government is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  profile_picture: z.string().optional(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
