import "server-only";

import { db } from "@/lib/db";

export interface DateRange {
  from: Date;
  to: Date;
}

export function parseDateRange(params: { from?: string; to?: string }): DateRange {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  defaultFrom.setHours(0, 0, 0, 0);

  const from = params.from ? new Date(params.from + "T00:00:00") : defaultFrom;
  const to = params.to ? new Date(params.to + "T23:59:59") : today;
  return { from, to };
}

/** Reporte: Ventas en el periodo, agrupadas por día */
export async function salesReport(range: DateRange) {
  const sales = await db.sale.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: "COMPLETED",
    },
    select: {
      id: true,
      code: true,
      createdAt: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      user: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true, docNumber: true } },
      _count: { select: { details: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = sales.reduce(
    (acc, s) => ({
      subtotal: acc.subtotal + Number(s.subtotal),
      discount: acc.discount + Number(s.discountAmount),
      tax: acc.tax + Number(s.taxAmount),
      total: acc.total + Number(s.total),
      count: acc.count + 1,
    }),
    { subtotal: 0, discount: 0, tax: 0, total: 0, count: 0 },
  );

  // Series diaria para gráfica
  const byDayMap = new Map<string, number>();
  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    byDayMap.set(key, (byDayMap.get(key) ?? 0) + Number(s.total));
  }
  const series = Array.from(byDayMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    sales: sales.map((s) => ({
      id: s.id,
      code: s.code,
      date: s.createdAt,
      cashier: s.user.name,
      customer: s.customer
        ? `${s.customer.firstName} ${s.customer.lastName ?? ""}`.trim()
        : null,
      items: s._count.details,
      subtotal: Number(s.subtotal),
      discount: Number(s.discountAmount),
      tax: Number(s.taxAmount),
      total: Number(s.total),
    })),
    totals,
    series,
  };
}

/** Reporte: Productos más vendidos (por variante o agrupado por producto) */
export async function topProductsReport(range: DateRange, limit = 20) {
  const details = await db.saleDetail.findMany({
    where: {
      sale: {
        createdAt: { gte: range.from, lte: range.to },
        status: "COMPLETED",
      },
    },
    select: {
      productName: true,
      variantInfo: true,
      quantity: true,
      subtotal: true,
      variant: {
        select: {
          sku: true,
          product: { select: { id: true, name: true, costPrice: true, salePrice: true } },
        },
      },
    },
  });

  // Agrupar por productId
  const map = new Map<
    string,
    {
      productId: string;
      productName: string;
      qty: number;
      revenue: number;
      cost: number;
    }
  >();
  for (const d of details) {
    const p = d.variant.product;
    const ex = map.get(p.id) ?? {
      productId: p.id,
      productName: p.name,
      qty: 0,
      revenue: 0,
      cost: 0,
    };
    ex.qty += d.quantity;
    ex.revenue += Number(d.subtotal);
    ex.cost += Number(p.costPrice) * d.quantity;
    map.set(p.id, ex);
  }

  return Array.from(map.values())
    .map((r) => ({ ...r, profit: r.revenue - r.cost }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

/** Reporte: Ganancias (utilidad = venta − costo) */
export async function profitsReport(range: DateRange) {
  const details = await db.saleDetail.findMany({
    where: {
      sale: { createdAt: { gte: range.from, lte: range.to }, status: "COMPLETED" },
    },
    select: {
      quantity: true,
      subtotal: true,
      variant: { select: { product: { select: { costPrice: true } } } },
    },
  });

  const revenue = details.reduce((s, d) => s + Number(d.subtotal), 0);
  const cost = details.reduce(
    (s, d) => s + Number(d.variant.product.costPrice) * d.quantity,
    0,
  );
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, cost, profit, margin };
}

/** Reporte: Resumen de cajas cerradas en el rango */
export async function cashRegistersReport(range: DateRange) {
  const registers = await db.cashRegister.findMany({
    where: {
      OR: [
        { openedAt: { gte: range.from, lte: range.to } },
        { closedAt: { gte: range.from, lte: range.to } },
      ],
    },
    include: {
      user: { select: { name: true } },
      sales: { where: { status: "COMPLETED" }, include: { payments: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  return registers.map((c) => {
    const cash = c.sales
      .flatMap((s) => s.payments)
      .filter((p) => p.method === "CASH")
      .reduce((s, p) => s + Number(p.amount), 0);
    const total = c.sales.reduce((s, x) => s + Number(x.total), 0);
    return {
      id: c.id,
      code: c.code,
      cashier: c.user.name,
      status: c.status,
      openedAt: c.openedAt,
      closedAt: c.closedAt,
      openingAmount: Number(c.openingAmount),
      cashIn: cash,
      expectedAmount: Number(c.expectedAmount ?? c.openingAmount) + (c.status === "OPEN" ? cash : 0),
      closingAmount: c.closingAmount ? Number(c.closingAmount) : null,
      difference: c.difference ? Number(c.difference) : null,
      salesCount: c.sales.length,
      salesTotal: total,
    };
  });
}
