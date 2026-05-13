import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Email inválido").max(120),
  name: z.string().min(1, "Nombre requerido").max(80),
  password: z.string().min(8, "Mínimo 8 caracteres").max(80),
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
  password: z.string().min(8, "Mínimo 8 caracteres").max(80),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
