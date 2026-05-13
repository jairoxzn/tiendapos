"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { customerSchema, type CustomerInput } from "@/lib/validations/customers";
import { fail, ok, prismaErrorMessage, type ActionResult } from "@/lib/prisma-helpers";

export async function createCustomerAction(
  input: CustomerInput,
): Promise<ActionResult<{ id: string; firstName: string; lastName: string | null; docNumber: string }>> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    const created = await db.customer.create({
      data: {
        docType: parsed.data.docType,
        docNumber: parsed.data.docNumber.trim(),
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/customers");
    return ok({
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      docNumber: created.docNumber,
    });
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Datos inválidos");

  try {
    await db.customer.update({
      where: { id },
      data: {
        docType: parsed.data.docType,
        docNumber: parsed.data.docNumber.trim(),
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function toggleCustomerAction(id: string, isActive: boolean): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  try {
    await db.customer.update({ where: { id }, data: { isActive } });
    revalidatePath("/customers");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("No autenticado.");

  try {
    const sales = await db.sale.count({ where: { customerId: id } });
    if (sales > 0) {
      return fail(
        `No se puede eliminar: ${sales} venta(s) asociadas. Desactívalo en su lugar.`,
      );
    }
    await db.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return ok(undefined);
  } catch (err) {
    return fail(prismaErrorMessage(err));
  }
}

export async function searchCustomers(q: string) {
  const session = await getSession();
  if (!session) return [];

  const query = q.trim();
  if (query.length < 2) return [];

  const results = await db.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { docNumber: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      docType: true,
      docNumber: true,
      firstName: true,
      lastName: true,
    },
    take: 10,
    orderBy: { firstName: "asc" },
  });
  return results;
}
