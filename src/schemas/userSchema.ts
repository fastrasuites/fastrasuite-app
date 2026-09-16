import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company_role: z.any(), // Simplified for debugging
  phone_number: z.string().min(1, "Phone number is required"),
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
  in_app_notifications: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  user_image_image: z.any().optional(),
  signature_image: z.any().optional(),
  access_codes: z.any().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
