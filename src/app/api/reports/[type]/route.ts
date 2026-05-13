import { renderToStream } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";

import { ReportePdfDocument, fmtMoney } from "@/components/pdf/reporte-document";
import { requireRole } from "@/lib/auth";
import { EMPRESA } from "@/lib/constants";
import { buildXlsxBuffer } from "@/lib/xlsx";

import {
  cashRegistersReport,
  parseDateRange,
  profitsReport,
  salesReport,
  topProductsReport,
} from "@/app/(dashboard)/reports/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportType = "sales" | "top-products" | "profits" | "cash-registers";

interface RouteContext {
  params: Promise<{ type: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole("ADMIN");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const { type } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "pdf").toLowerCase();
  const range = parseDateRange({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  const rangeLabel = {
    from: range.from.toISOString().slice(0, 10),
    to: range.to.toISOString().slice(0, 10),
  };

  if (!["sales", "top-products", "profits", "cash-registers"].includes(type)) {
    return new Response("Tipo de reporte inválido", { status: 400 });
  }

  const t = type as ReportType;

  // ---------- Construir filas según tipo ----------
  let title = "";
  let columns: { key: string; label: string; align?: "left" | "right" | "center"; width?: number }[] = [];
  let rows: Record<string, string | number>[] = [];
  let totals: { label: string; value: string }[] = [];
  let xlsxRows: Record<string, string | number | Date | null>[] = [];

  if (t === "sales") {
    title = "Reporte de ventas";
    const data = await salesReport(range);
    columns = [
      { key: "code", label: "Código", width: 1 },
      { key: "date", label: "Fecha", width: 1.3 },
      { key: "cashier", label: "Cajero", width: 1.2 },
      { key: "customer", label: "Cliente", width: 1.5 },
      { key: "items", label: "Items", align: "center", width: 0.6 },
      { key: "subtotal", label: "Subtotal", align: "right", width: 1 },
      { key: "tax", label: "IGV", align: "right", width: 1 },
      { key: "total", label: "Total", align: "right", width: 1 },
    ];
    rows = data.sales.map((s) => ({
      code: s.code,
      date: s.date.toLocaleString("es-PE"),
      cashier: s.cashier,
      customer: s.customer ?? "—",
      items: s.items,
      subtotal: fmtMoney(s.subtotal),
      tax: fmtMoney(s.tax),
      total: fmtMoney(s.total),
    }));
    xlsxRows = data.sales.map((s) => ({
      Código: s.code,
      Fecha: s.date,
      Cajero: s.cashier,
      Cliente: s.customer,
      Items: s.items,
      Subtotal: s.subtotal,
      Descuento: s.discount,
      IGV: s.tax,
      Total: s.total,
    }));
    totals = [
      { label: "Ventas", value: String(data.totals.count) },
      { label: "Subtotal", value: fmtMoney(data.totals.subtotal) },
      { label: "IGV", value: fmtMoney(data.totals.tax) },
      { label: "Total", value: fmtMoney(data.totals.total) },
    ];
  } else if (t === "top-products") {
    title = "Productos más vendidos";
    const data = await topProductsReport(range, 100);
    columns = [
      { key: "productName", label: "Producto", width: 3 },
      { key: "qty", label: "Cant.", align: "center", width: 0.8 },
      { key: "revenue", label: "Ingresos", align: "right", width: 1.2 },
      { key: "cost", label: "Costo", align: "right", width: 1.2 },
      { key: "profit", label: "Utilidad", align: "right", width: 1.2 },
    ];
    rows = data.map((r) => ({
      productName: r.productName,
      qty: r.qty,
      revenue: fmtMoney(r.revenue),
      cost: fmtMoney(r.cost),
      profit: fmtMoney(r.profit),
    }));
    xlsxRows = data.map((r) => ({
      Producto: r.productName,
      Cantidad: r.qty,
      Ingresos: r.revenue,
      Costo: r.cost,
      Utilidad: r.profit,
    }));
  } else if (t === "profits") {
    title = "Reporte de ganancias";
    const data = await profitsReport(range);
    columns = [
      { key: "concept", label: "Concepto", width: 2 },
      { key: "amount", label: "Monto", align: "right", width: 1 },
    ];
    rows = [
      { concept: "Ingresos (sin IGV)", amount: fmtMoney(data.revenue) },
      { concept: "Costo de productos", amount: fmtMoney(data.cost) },
      { concept: "Utilidad", amount: fmtMoney(data.profit) },
      { concept: "Margen", amount: `${data.margin.toFixed(2)}%` },
    ];
    xlsxRows = [
      { Concepto: "Ingresos (sin IGV)", Monto: data.revenue },
      { Concepto: "Costo de productos", Monto: data.cost },
      { Concepto: "Utilidad", Monto: data.profit },
      { Concepto: "Margen (%)", Monto: data.margin },
    ];
    totals = [
      { label: "Utilidad", value: fmtMoney(data.profit) },
      { label: "Margen", value: `${data.margin.toFixed(2)}%` },
    ];
  } else if (t === "cash-registers") {
    title = "Reporte de caja";
    const data = await cashRegistersReport(range);
    columns = [
      { key: "code", label: "Código", width: 1.4 },
      { key: "cashier", label: "Cajero", width: 1.2 },
      { key: "openedAt", label: "Abierta", width: 1.3 },
      { key: "closedAt", label: "Cerrada", width: 1.3 },
      { key: "opening", label: "Inicial", align: "right", width: 1 },
      { key: "cashIn", label: "Efec. ventas", align: "right", width: 1.1 },
      { key: "expected", label: "Esperado", align: "right", width: 1 },
      { key: "closing", label: "Contado", align: "right", width: 1 },
      { key: "difference", label: "Dif.", align: "right", width: 0.9 },
    ];
    rows = data.map((r) => ({
      code: r.code,
      cashier: r.cashier,
      openedAt: r.openedAt.toLocaleString("es-PE"),
      closedAt: r.closedAt ? r.closedAt.toLocaleString("es-PE") : "—",
      opening: fmtMoney(r.openingAmount),
      cashIn: fmtMoney(r.cashIn),
      expected: fmtMoney(r.expectedAmount),
      closing: r.closingAmount ? fmtMoney(r.closingAmount) : "—",
      difference: r.difference !== null ? fmtMoney(r.difference) : "—",
    }));
    xlsxRows = data.map((r) => ({
      Código: r.code,
      Cajero: r.cashier,
      Abierta: r.openedAt,
      Cerrada: r.closedAt,
      Inicial: r.openingAmount,
      "Efectivo ventas": r.cashIn,
      Esperado: r.expectedAmount,
      Contado: r.closingAmount,
      Diferencia: r.difference,
      "Ventas #": r.salesCount,
      "Ventas total": r.salesTotal,
    }));
  }

  if (format === "xlsx") {
    const buffer = buildXlsxBuffer([{ name: title, rows: xlsxRows }]);
    return new Response(buffer as unknown as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${slugify(title)}-${rangeLabel.from}-a-${rangeLabel.to}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // PDF por defecto
  const stream = await renderToStream(
    ReportePdfDocument({
      empresa: { nombre: EMPRESA.nombre, ruc: EMPRESA.ruc },
      title,
      range: rangeLabel,
      columns,
      rows,
      totals,
    }),
  );
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugify(title)}-${rangeLabel.from}-a-${rangeLabel.to}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}
