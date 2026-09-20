import { z } from "zod";
export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s()+-]/g, "");
  if (/^\d{9}$/.test(digits)) return "+992" + digits;
  if (/^992\d{9}$/.test(digits)) return "+" + digits;
  return "";
}
export function formatPhone(value: string) {
  const p = normalizePhone(value);
  return p
    ? p.replace(/^(\+992)(\d{2})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5")
    : value;
}
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((v) => /^\+992\d{9}$/.test(v), "phoneError");
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(8, "passwordError").max(128, "passwordError"),
});
export const registerSchema = loginSchema
  .extend({ confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: "passwordMatch",
    path: ["confirm"],
  });
export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "required").max(100),
    phone: phoneSchema,
    city: z.string().trim().min(2, "required").max(100),
    address: z.string().trim().max(300),
    delivery: z.enum(["delivery", "pickup"]),
    comment: z.string().trim().max(1000),
  })
  .refine((d) => d.delivery === "pickup" || d.address.length >= 3, {
    message: "required",
    path: ["address"],
  });
export const contactSchema = z.object({
  name: z.string().trim().min(2, "required").max(100),
  phone: phoneSchema,
  subject: z.string().trim().min(2, "required").max(150),
  message: z.string().trim().min(10, "messageError").max(3000),
  website: z.string().max(0),
});
