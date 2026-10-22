import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "email_required" })
    .max(254, { message: "email_invalid" })
    .email({ message: "email_invalid" }),
  company: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "name_required" })
    .max(80, { message: "name_required" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "email_required" })
    .max(254, { message: "email_invalid" })
    .email({ message: "email_invalid" }),
  message: z
    .string()
    .trim()
    .min(20, { message: "message_short" })
    .max(4000, { message: "message_short" }),
  locale: z.enum(["pt", "en", "es", "fr"]).default("pt"),
  company: z.string().max(0).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
