import Link from "next/link";
import { Receipt, ReceiptText } from "lucide-react";
import type { Prisma, SaleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import { SalesFilters } from "./sales-filters";

export const metadata = { title: "Ventas" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<SaleStatus, { label: string; variant: "success" | "destructive" | "warning" | "secondary" }> =
  {
    COMPLETED: { label: "Completada", variant: "success" },
    REFUNDED: { label: "Anulada", variant: "destructive" },
    CANCELLED: { label: "Cancelada", variant: "secondary" },
    PENDING: { label: "Pendiente", variant: "warning" },
  };

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status;

  const where: Prisma.SaleWhereInput = {};
  if (status && status !== "all") where.status = status as SaleStatus;
  if (q) where.code = { contains: q, mode: "insensitive" };

  const sales = await db.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true } },
      _count: { select: { details: true } },
    },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Ventas"
        description="Historial de ventas registradas en el POS."
      />

      <SalesFilters />

      <Card>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title={q ? "Sin resultados" : "Aún no hay ventas"}
                description={
                  q
                    ? "Prueba con otro código."
                    : "Las ventas registradas desde el POS aparecerán aquí."
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Cajero</TableHead>
                  <TableHead className="hidden text-center lg:table-cell">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Imprimir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => {
                  const meta = STATUS_META[s.status];
                  const customer = s.customer
                    ? `${s.customer.firstName} ${s.customer.lastName ?? ""}`.trim()
                    : "—";
                  return (
                    <TableRow key={s.id} className="cursor-pointer">
                      <TableCell className="font-mono text-xs">
                        <Link href={`/sales/${s.id}`} className="hover:underline">
                          {s.code}
                        </Link>
                        <div className="mt-0.5 text-[11px] text-muted-foreground md:hidden">
                          {formatDateTime(s.createdAt)}
                        </div>
                        <div className="mt-0.5 text-[11px] sm:hidden">
                          <Badge variant={meta.variant} className="px-1.5 py-0">
                            {meta.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {formatDateTime(s.createdAt)}
                      </TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">{customer}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {s.user.name}
                      </TableCell>
                      <TableCell className="hidden text-center text-sm lg:table-cell">
                        {s._count.details}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(s.total))}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          title="Imprimir Nota de Venta"
                        >
                          <a
                            href={`/api/sales/${s.id}/nota-venta`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ReceiptText className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
