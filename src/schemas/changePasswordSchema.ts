import { z } from "zod";

export const changePasswordSchema = z.object({
  old_password: z.string().min(8, "Old password must be at least 8 characters"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;