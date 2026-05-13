import { renderToStream } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";

import { BoletaDocument } from "@/components/pdf/boleta-document";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { EMPRESA, IGV_PERCENT } from "@/lib/constants";

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
  }).format(sale.createdAt);

  const stream = await renderToStream(
    BoletaDocument({
      empresa: {
        nombre: EMPRESA.nombre,
        ruc: EMPRESA.ruc,
        direccion: EMPRESA.direccion,
        telefono: EMPRESA.telefono,
      },
      sale: {
        code: sale.code,
        createdAt: formattedDate,
        status: sale.status,
        subtotal: Number(sale.subtotal),
        discountAmount: Number(sale.discountAmount),
        taxAmount: Number(sale.taxAmount),
        total: Number(sale.total),
        igvPercent: IGV_PERCENT,
        notes: sale.notes,
        cashier: sale.user.name,
        customer: sale.customer
          ? {
              name: `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim(),
              doc: `${sale.customer.docType}: ${sale.customer.docNumber}`,
            }
          : null,
        details: sale.details.map((d) => ({
          productName: d.productName,
          variantInfo: d.variantInfo,
          quantity: d.quantity,
          unitPrice: Number(d.unitPrice),
          discount: Number(d.discount),
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
      "Content-Disposition": `inline; filename="${sale.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
