import { z } from "zod";

export const locationSchema = z.object({
  location_code: z
    .string()
    .min(1, "Location code is required")
    .max(4, "Location code must be exactly 4 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Location code must contain only uppercase letters and numbers"
    ),
  location_name: z.string().min(1, "Location name is required"),
  location_type: z.enum(["internal", "partner"], {
    message: "Location type is required",
  }),
  address: z.string().min(1, "Address is required"),
  location_manager: z.number({
    message: "Location manager is required",
  }),
  store_keeper: z.number({
    message: "Store keeper is required",
  }),
  contact_information: z.string().optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;
