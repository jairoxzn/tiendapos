"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { brandSchema, type BrandInput } from "@/lib/validations/catalog";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";
import { slugify } from "@/lib/utils";

export async function createBrandAction(input: BrandInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const created = await db.brand.create({
      data: {
        name: parsed.data.name.trim(),
        slug: slugify(parsed.data.name),
        logoUrl: parsed.data.logoUrl || null,
      },
    });
    revalidatePath("/brands");
    return ok({ id: created.id });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function updateBrandAction(id: string, input: BrandInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    await db.brand.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        slug: slugify(parsed.data.name),
        logoUrl: parsed.data.logoUrl || null,
      },
    });
    revalidatePath("/brands");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function toggleBrandAction(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  try {
    await db.brand.update({ where: { id }, data: { isActive } });
    revalidatePath("/brands");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  try {
    const inUse = await db.product.count({ where: { brandId: id } });
    if (inUse > 0) {
      return fail(`No se puede eliminar: ${inUse} producto(s) usan esta marca.`);
    }
    await db.brand.delete({ where: { id } });
    revalidatePath("/brands");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}
