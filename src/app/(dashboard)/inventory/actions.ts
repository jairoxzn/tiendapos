"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  inventoryMovementSchema,
  type InventoryMovementInput,
} from "@/lib/validations/catalog";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";

/**
 * Registra un movimiento de inventario y actualiza el stock de la variante
 * en una transacción atómica.
 */
export async function createMovementAction(
  input: InventoryMovementInput,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = inventoryMovementSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const { variantId, type, quantity, unitCost, reason, reference } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const variant = await tx.variant.findUnique({ where: { id: variantId } });
      if (!variant) throw new Error("Variante no encontrada");

      // IN/RETURN suman stock; OUT resta; ADJUSTMENT puede sumar o restar — aquí lo
      // tratamos como cantidad ABSOLUTA destino (más predecible para correcciones).
      let stockAfter: number;
      let signedDelta: number;

      switch (type) {
        case "IN":
        case "RETURN":
          signedDelta = quantity;
          stockAfter = variant.stock + quantity;
          break;
        case "OUT":
          signedDelta = -quantity;
          stockAfter = variant.stock - quantity;
          if (stockAfter < 0) throw new Error("Stock insuficiente para esta salida.");
          break;
        case "ADJUSTMENT":
          // En ajustes, `quantity` representa el stock final deseado
          stockAfter = quantity;
          signedDelta = quantity - variant.stock;
          break;
      }

      await tx.variant.update({
        where: { id: variantId },
        data: { stock: stockAfter },
      });

      await tx.inventoryMovement.create({
        data: {
          type,
          quantity: Math.abs(signedDelta),
          stockBefore: variant.stock,
          stockAfter,
          unitCost: unitCost ? new Prisma.Decimal(unitCost) : null,
          reason: reason || null,
          reference: reference || null,
          variantId,
          userId: session.sub,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/movements");
    revalidatePath("/products");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}
