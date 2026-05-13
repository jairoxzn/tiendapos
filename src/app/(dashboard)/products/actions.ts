"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { productSchema, type ProductInput } from "@/lib/validations/catalog";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";

export async function createProductAction(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  await requireSession();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const d = parsed.data;

  // Validar SKUs únicos dentro del set de variantes
  const variantSkus = d.variants.map((v) => v.sku);
  if (new Set(variantSkus).size !== variantSkus.length) {
    return fail("Hay SKUs de variante duplicados en el formulario.");
  }

  try {
    const created = await db.product.create({
      data: {
        sku: d.sku.trim(),
        name: d.name.trim(),
        description: d.description || null,
        imageUrl: d.imageUrl || null,
        categoryId: d.categoryId,
        brandId: d.brandId || null,
        costPrice: new Prisma.Decimal(d.costPrice),
        salePrice: new Prisma.Decimal(d.salePrice),
        minStock: d.minStock,
        variants: {
          create: d.variants.map((v) => ({
            sku: v.sku.trim(),
            size: v.size.trim(),
            color: v.color.trim(),
            colorHex: v.colorHex || null,
            barcode: v.barcode || null,
            stock: v.stock,
          })),
        },
      },
    });
    revalidatePath("/products");
    revalidatePath("/inventory");
    return ok({ id: created.id });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  await requireSession();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const d = parsed.data;
  const variantSkus = d.variants.map((v) => v.sku);
  if (new Set(variantSkus).size !== variantSkus.length) {
    return fail("Hay SKUs de variante duplicados en el formulario.");
  }

  try {
    await db.$transaction(async (tx) => {
      // Actualizar campos del producto
      await tx.product.update({
        where: { id },
        data: {
          sku: d.sku.trim(),
          name: d.name.trim(),
          description: d.description || null,
          imageUrl: d.imageUrl || null,
          categoryId: d.categoryId,
          brandId: d.brandId || null,
          costPrice: new Prisma.Decimal(d.costPrice),
          salePrice: new Prisma.Decimal(d.salePrice),
          minStock: d.minStock,
        },
      });

      // Sincronizar variantes (upsert por id, delete las no enviadas)
      const incomingIds = d.variants.filter((v) => v.id).map((v) => v.id!);
      await tx.variant.deleteMany({
        where: { productId: id, id: { notIn: incomingIds.length ? incomingIds : ["__none__"] } },
      });

      for (const v of d.variants) {
        if (v.id) {
          await tx.variant.update({
            where: { id: v.id },
            data: {
              sku: v.sku.trim(),
              size: v.size.trim(),
              color: v.color.trim(),
              colorHex: v.colorHex || null,
              barcode: v.barcode || null,
              stock: v.stock,
            },
          });
        } else {
          await tx.variant.create({
            data: {
              productId: id,
              sku: v.sku.trim(),
              size: v.size.trim(),
              color: v.color.trim(),
              colorHex: v.colorHex || null,
              barcode: v.barcode || null,
              stock: v.stock,
            },
          });
        }
      }
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath(`/products/${id}`);
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function toggleProductAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireSession();
  try {
    await db.product.update({ where: { id }, data: { isActive } });
    revalidatePath("/products");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireSession();
  try {
    const sold = await db.saleDetail.count({ where: { variant: { productId: id } } });
    if (sold > 0) {
      return fail("No se puede eliminar: hay ventas asociadas. Desactívalo en su lugar.");
    }
    // Las variantes se borran por cascada
    await db.product.delete({ where: { id } });
    revalidatePath("/products");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteProductAndRedirect(id: string) {
  const res = await deleteProductAction(id);
  if (!res.ok) return res;
  redirect("/products");
}
