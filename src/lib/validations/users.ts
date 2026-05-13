import { z } from "zod";

/**
 * Política de contraseña:
 * - mínimo 8 caracteres
 * - al menos una letra
 * - al menos un dígito
 *
 * Suficientemente estricto para evitar pwds triviales como "12345678" o "password"
 * sin volverse hostil con el usuario (no exigimos símbolos ni mayúsculas).
 */
export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(80, "Máximo 80 caracteres")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/\d/, "Debe incluir al menos un dígito");

export const createUserSchema = z.object({
  email: z.string().email("Email inválido").max(120),
  name: z.string().min(1, "Nombre requerido").max(80),
  password: passwordSchema,
  role: z.enum(["ADMIN", "CASHIER"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(80),
  role: z.enum(["ADMIN", "CASHIER"]),
  isActive: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
