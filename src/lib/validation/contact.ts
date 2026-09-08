import { z } from "zod";
import { emailSchema } from "./auth";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be 2000 characters or fewer"),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
