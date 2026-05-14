import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  RotateCcw,
  Settings2,
} from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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

import { MovementsFilters } from "./movements-filters";

export const metadata = { title: "Kardex" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

const TYPE_META: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary"; Icon: typeof ArrowDownToLine }
> = {
  IN: { label: "Entrada", variant: "success", Icon: ArrowDownToLine },
  OUT: { label: "Salida", variant: "destructive", Icon: ArrowUpFromLine },
  RETURN: { label: "Devolución", variant: "warning", Icon: RotateCcw },
  ADJUSTMENT: { label: "Ajuste", variant: "secondary", Icon: Settings2 },
};

export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const type = params.type;

  const where: Prisma.InventoryMovementWhereInput = {};
  if (type && type !== "all") {
    where.type = type as Prisma.InventoryMovementWhereInput["type"];
  }
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { reason: { contains: q, mode: "insensitive" } },
      { variant: { sku: { contains: q, mode: "insensitive" } } },
      { variant: { product: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const movements = await db.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      variant: {
        select: {
          sku: true,
          size: true,
          color: true,
          product: { select: { name: true } },
        },
      },
      user: { select: { name: true } },
    },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kardex de inventario</h1>
          <p className="text-sm text-muted-foreground">
            Historial de todos los movimientos. Últimos 200.
          </p>
        </div>
      </div>

      <MovementsFilters />

      <Card>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={History}
                title="Sin movimientos"
                description="Cuando registres entradas, salidas o ajustes aparecerán aquí."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Variante</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Referencia</TableHead>
                  <TableHead className="hidden lg:table-cell">Costo</TableHead>
                  <TableHead className="hidden md:table-cell">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const meta = TYPE_META[m.type];
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>
                          <meta.Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{meta.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.variant.product.name}
                        <div className="text-[11px] font-normal text-muted-foreground md:hidden">
                          {m.variant.size} / {m.variant.color} · {formatDateTime(m.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {m.variant.size} / {m.variant.color}
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {m.variant.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-center font-medium">{m.quantity}</TableCell>
                      <TableCell className="hidden text-center text-sm text-muted-foreground sm:table-cell">
                        {m.stockBefore} → <span className="font-medium text-foreground">{m.stockAfter}</span>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">{m.reference ?? "—"}</TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {m.unitCost ? formatCurrency(Number(m.unitCost)) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {m.user.name}
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
