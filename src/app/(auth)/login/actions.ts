"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) {
    return { ok: false, error: "Credenciales incorrectas" };
  }

  const valid = await verifyPassword(parsed.data.password, user.password);
  if (!valid) {
    return { ok: false, error: "Credenciales incorrectas" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSessionCookie({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const next = String(formData.get("next") ?? "/dashboard") || "/dashboard";
  redirect(next.startsWith("/") ? next : "/dashboard");
}
