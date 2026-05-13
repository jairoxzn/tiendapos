import "server-only";

import { db } from "@/lib/db";

/**
 * Devuelve la caja abierta más reciente para un usuario.
 * Helper NO expuesto como server action (no debe ser invocable desde el cliente
 * con un userId arbitrario).
 */
export async function getOpenCashRegisterForUser(userId: string) {
  return db.cashRegister.findFirst({
    where: { userId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}
