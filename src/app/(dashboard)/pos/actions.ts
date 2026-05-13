"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createSaleSchema, type CreateSaleInput } from "@/lib/validations/sales";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";
import { computeTotals, formatSaleCode, round2 } from "@/lib/sales";
import { IGV_PERCENT } from "@/lib/constants";

import { getOpenCashRegisterForUser } from "../cash-register/actions";

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  salePrice: number;
  category: string;
  variants: {
    id: string;
    size: string;
    color: string;
    colorHex: string | null;
    stock: number;
    sku: string;
  }[];
}

export async function searchProductsForPos(query: string): Promise<ProductSearchResult[]> {
  await requireSession();
  const q = query.trim();

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(q.length > 0 && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          { variants: { some: { barcode: { contains: q, mode: "insensitive" } } } },
        ],
      }),
    },
    take: 30,
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      variants: {
        where: { isActive: true },
        orderBy: [{ size: "asc" }, { color: "asc" }],
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    imageUrl: p.imageUrl,
    salePrice: Number(p.salePrice),
    category: p.category.name,
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      stock: v.stock,
      sku: v.sku,
    })),
  }));
}

export async function createSaleAction(
  input: CreateSaleInput,
): Promise<ActionResult<{ id: string; code: string }>> {
  const session = await requireSession();
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const cashRegister = await getOpenCashRegisterForUser(session.sub);
  if (!cashRegister) return fail("Necesitas abrir caja antes de cobrar.");

  try {
    const result = await db.$transaction(async (tx) => {
      // Validar variantes + stock + precios
      const variantIds = parsed.data.lines.map((l) => l.variantId);
      const variants = await tx.variant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { name: true } } },
      });
      const map = new Map(variants.map((v) => [v.id, v]));

      const detailsData: {
        variantId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        subtotal: number;
        productName: string;
        variantInfo: string;
      }[] = [];

      for (const line of parsed.data.lines) {
        const v = map.get(line.variantId);
        if (!v) throw new Error("Variante no encontrada");
        if (v.stock < line.quantity) {
          throw new Error(
            `Stock insuficiente para ${v.product.name} ${v.size}/${v.color} (queda ${v.stock}).`,
          );
        }
        detailsData.push({
          variantId: v.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount,
          subtotal: round2(line.unitPrice * line.quantity - line.discount),
          productName: v.product.name,
          variantInfo: `${v.size} / ${v.color}`,
        });
      }

      // Totales
      const totals = computeTotals(parsed.data.lines, parsed.data.generalDiscount, IGV_PERCENT);

      // Validar suma de pagos contra total (tolerancia 1 céntimo)
      const totalPayments = parsed.data.payments.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(totalPayments - totals.total) > 0.01) {
        throw new Error(
          `Los pagos (S/${totalPayments.toFixed(2)}) no coinciden con el total (S/${totals.total.toFixed(2)}).`,
        );
      }

      // Código secuencial
      const seq = (await tx.sale.count()) + 1;
      const code = formatSaleCode(seq);

      const sale = await tx.sale.create({
        data: {
          code,
          status: "COMPLETED",
          subtotal: new Prisma.Decimal(totals.subtotal),
          discountAmount: new Prisma.Decimal(totals.discountAmount),
          taxAmount: new Prisma.Decimal(totals.taxAmount),
          total: new Prisma.Decimal(totals.total),
          notes: parsed.data.notes || null,
          userId: session.sub,
          customerId: parsed.data.customerId || null,
          cashRegisterId: cashRegister.id,
          details: {
            create: detailsData.map((d) => ({
              variantId: d.variantId,
              quantity: d.quantity,
              unitPrice: new Prisma.Decimal(d.unitPrice),
              discount: new Prisma.Decimal(d.discount),
              subtotal: new Prisma.Decimal(d.subtotal),
              productName: d.productName,
              variantInfo: d.variantInfo,
            })),
          },
          payments: {
            create: parsed.data.payments.map((p) => ({
              method: p.method,
              amount: new Prisma.Decimal(p.amount),
              reference: p.reference || null,
            })),
          },
        },
      });

      // Descontar stock + crear movimientos OUT
      for (const d of detailsData) {
        const v = map.get(d.variantId)!;
        const newStock = v.stock - d.quantity;
        await tx.variant.update({
          where: { id: v.id },
          data: { stock: newStock },
        });
        await tx.inventoryMovement.create({
          data: {
            type: "OUT",
            quantity: d.quantity,
            stockBefore: v.stock,
            stockAfter: newStock,
            reference: code,
            reason: `Venta ${code}`,
            variantId: v.id,
            userId: session.sub,
            saleId: sale.id,
          },
        });
      }

      return { id: sale.id, code: sale.code };
    });

    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return ok(result);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function voidSaleAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (session.role !== "ADMIN") return fail("Solo administradores pueden anular ventas.");

  try {
    await db.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { details: { include: { variant: true } } },
      });
      if (!sale) throw new Error("Venta no encontrada");
      if (sale.status !== "COMPLETED") throw new Error("Solo se pueden anular ventas completadas.");

      // Devolver stock + movimiento RETURN
      for (const d of sale.details) {
        const v = d.variant;
        const newStock = v.stock + d.quantity;
        await tx.variant.update({ where: { id: v.id }, data: { stock: newStock } });
        await tx.inventoryMovement.create({
          data: {
            type: "RETURN",
            quantity: d.quantity,
            stockBefore: v.stock,
            stockAfter: newStock,
            reference: sale.code,
            reason: `Anulación de venta ${sale.code}`,
            variantId: v.id,
            userId: session.sub,
            saleId: sale.id,
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: { status: "REFUNDED" },
      });
    });

    revalidatePath("/sales");
    revalidatePath("/sales/" + id);
    revalidatePath("/inventory");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}
