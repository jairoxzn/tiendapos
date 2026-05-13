"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireRole, requireSession, hashPassword } from "@/lib/auth";
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  type CreateUserInput,
  type ResetPasswordInput,
  type UpdateUserInput,
} from "@/lib/validations/users";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";

export async function createUserAction(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  await requireRole("ADMIN");
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const hashed = await hashPassword(parsed.data.password);
    const created = await db.user.create({
      data: {
        email: parsed.data.email.toLowerCase().trim(),
        name: parsed.data.name.trim(),
        password: hashed,
        role: parsed.data.role,
      },
    });
    revalidatePath("/users");
    return ok({ id: created.id });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult> {
  const session = await requireRole("ADMIN");
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  // Evitar que el admin se quite a sí mismo el rol o se desactive
  if (id === session.sub) {
    if (parsed.data.role !== "ADMIN") return fail("No puedes quitarte tu propio rol de admin.");
    if (!parsed.data.isActive) return fail("No puedes desactivar tu propia cuenta.");
  }

  try {
    await db.user.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
    });
    revalidatePath("/users");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function resetUserPasswordAction(
  id: string,
  input: ResetPasswordInput,
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const hashed = await hashPassword(parsed.data.password);
    await db.user.update({ where: { id }, data: { password: hashed } });
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const session = await requireRole("ADMIN");
  if (id === session.sub) return fail("No puedes eliminar tu propia cuenta.");

  try {
    const salesCount = await db.sale.count({ where: { userId: id } });
    if (salesCount > 0) {
      return fail(
        `No se puede eliminar: ${salesCount} venta(s) registradas por este usuario. Desactívalo en su lugar.`,
      );
    }
    await db.user.delete({ where: { id } });
    revalidatePath("/users");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function changeOwnPasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const session = await requireSession();
  if (newPassword.length < 8) return fail("Mínimo 8 caracteres.");

  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) return fail("Usuario no encontrado.");

  // Re-importamos aquí para evitar cycle si pasara
  const bcrypt = await import("bcryptjs");
  const ok2 = await bcrypt.compare(currentPassword, user.password);
  if (!ok2) return fail("Contraseña actual incorrecta.");

  await db.user.update({
    where: { id: session.sub },
    data: { password: await hashPassword(newPassword) },
  });
  return ok(undefined);
}
