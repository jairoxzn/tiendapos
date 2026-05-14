import { renderToStream } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";

import { NotaVentaDocument } from "@/components/pdf/nota-venta-document";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { EMPRESA } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      customer: true,
      details: true,
      payments: true,
    },
  });

  if (!sale) return new Response("Not found", { status: 404 });

  const formattedDate = new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(sale.createdAt);

  const customerName = sale.customer
    ? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim()
    : "CLIENTE GENERICO";
  const customerDoc = sale.customer
    ? `${sale.customer.docType}: ${sale.customer.docNumber}`
    : "88888888";

  const stream = await renderToStream(
    NotaVentaDocument({
      empresa: {
        nombre: EMPRESA.nombre,
        ruc: EMPRESA.ruc,
        direccion: EMPRESA.direccion,
        telefono: EMPRESA.telefono,
      },
      sale: {
        code: sale.code,
        createdAt: formattedDate,
        subtotal: Number(sale.subtotal),
        discountAmount: Number(sale.discountAmount),
        total: Number(sale.total),
        cashier: sale.user.name,
        customer: { name: customerName, doc: customerDoc },
        details: sale.details.map((d) => ({
          productName: d.productName,
          variantInfo: d.variantInfo,
          quantity: d.quantity,
          unitPrice: Number(d.unitPrice),
          subtotal: Number(d.subtotal),
        })),
        payments: sale.payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
          reference: p.reference,
        })),
      },
    }),
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="nota-${sale.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
