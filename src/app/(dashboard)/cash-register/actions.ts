"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOpenCashRegisterForUser } from "@/lib/cash-register-queries";
import {
  closeCashRegisterSchema,
  openCashRegisterSchema,
  type CloseCashRegisterInput,
  type OpenCashRegisterInput,
} from "@/lib/validations/sales";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";

function generateCashRegisterCode(seq: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `CAJA-${y}-${m}-${d}-${String(seq).padStart(3, "0")}`;
}

export async function openCashRegisterAction(
  input: OpenCashRegisterInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = openCashRegisterSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const already = await getOpenCashRegisterForUser(session.sub);
    if (already) return fail("Ya tienes una caja abierta. Ciérrala antes de abrir otra.");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const seq = (await db.cashRegister.count({ where: { openedAt: { gte: todayStart } } })) + 1;

    const created = await db.cashRegister.create({
      data: {
        code: generateCashRegisterCode(seq),
        openingAmount: new Prisma.Decimal(parsed.data.openingAmount),
        notes: parsed.data.notes || null,
        userId: session.sub,
      },
    });
    revalidatePath("/cash-register");
    revalidatePath("/pos");
    return ok({ id: created.id });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function closeCashRegisterAction(
  id: string,
  input: CloseCashRegisterInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = closeCashRegisterSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const register = await db.cashRegister.findUnique({
      where: { id },
      include: {
        sales: {
          where: { status: "COMPLETED" },
          include: { payments: true },
        },
      },
    });
    if (!register) return fail("Caja no encontrada");
    if (register.userId !== session.sub && session.role !== "ADMIN") {
      return fail("Esta caja pertenece a otro usuario.");
    }
    if (register.status === "CLOSED") return fail("La caja ya está cerrada.");

    const cashSales = register.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === "CASH")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const expected = Number(register.openingAmount) + cashSales;
    const closing = parsed.data.closingAmount;
    const difference = closing - expected;

    await db.cashRegister.update({
      where: { id },
      data: {
        status: "CLOSED",
        closingAmount: new Prisma.Decimal(closing),
        expectedAmount: new Prisma.Decimal(expected),
        difference: new Prisma.Decimal(difference),
        closedAt: new Date(),
        notes: parsed.data.notes ? parsed.data.notes : register.notes,
      },
    });

    revalidatePath("/cash-register");
    revalidatePath("/pos");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}
