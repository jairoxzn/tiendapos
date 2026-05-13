import { Prisma } from "@prisma/client";

/**
 * Recursivamente convierte instancias de Prisma.Decimal a number puro
 * para que sean serializables a Client Components.
 */
export function toPlain<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as unknown as T;
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map((v) => toPlain(v)) as unknown as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toPlain(v);
    }
    return out as T;
  }

  return value;
}

/**
 * Convierte errores conocidos de Prisma a mensajes legibles en español.
 */
export function prismaErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[] | undefined)?.join(", ");
        return target
          ? `Ya existe un registro con ${target}.`
          : "Ya existe un registro único con ese valor.";
      }
      case "P2003":
        return "Operación bloqueada por una referencia existente.";
      case "P2025":
        return "Registro no encontrado.";
      default:
        return `Error de base de datos (${err.code}).`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido.";
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}
