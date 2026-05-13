"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = {
  ok: boolean;
  error?: string;
};

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

/**
 * Mensaje genérico para "no match" o "cuenta inválida" — no revelamos si el email
 * existe para evitar enumeración de usuarios.
 */
const INVALID_CREDS = "Credenciales incorrectas.";

// Hash bcrypt dummy con costo 10 — usado para igualar tiempo de respuesta cuando
// el email no existe (mitigación de timing attacks que infieren existencia).
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

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
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    return { ok: false, error: INVALID_CREDS };
  }

  // Cuenta bloqueada por intentos previos?
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      ok: false,
      error: `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${remaining} min.`,
    };
  }

  const valid = await verifyPassword(parsed.data.password, user.password);

  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_ATTEMPTS;

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });

    if (lock) {
      return {
        ok: false,
        error: `Cuenta bloqueada por ${LOCK_MINUTES} min tras ${MAX_ATTEMPTS} intentos fallidos.`,
      };
    }

    const remaining = MAX_ATTEMPTS - attempts;
    return {
      ok: false,
      error: `${INVALID_CREDS} Te quedan ${remaining} intento${remaining === 1 ? "" : "s"}.`,
    };
  }

  // Login exitoso — limpiar contadores
  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
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
