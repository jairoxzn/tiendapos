"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { categorySchema, type CategoryInput } from "@/lib/validations/catalog";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";
import { slugify } from "@/lib/utils";

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const created = await db.category.create({
      data: {
        name: parsed.data.name.trim(),
        slug: slugify(parsed.data.name),
        description: parsed.data.description || null,
      },
    });
    revalidatePath("/categories");
    return ok({ id: created.id });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    await db.category.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        slug: slugify(parsed.data.name),
        description: parsed.data.description || null,
      },
    });
    revalidatePath("/categories");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function toggleCategoryAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireSession();
  try {
    await db.category.update({ where: { id }, data: { isActive } });
    revalidatePath("/categories");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireSession();
  try {
    const inUse = await db.product.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return fail(
        `No se puede eliminar: ${inUse} producto(s) usan esta categoría. Desactívala en su lugar.`,
      );
    }
    await db.category.delete({ where: { id } });
    revalidatePath("/categories");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}
