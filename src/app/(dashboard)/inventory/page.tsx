import Link from "next/link";
import { AlertTriangle, ArrowDownUp, Boxes, History } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
import { formatCurrency } from "@/lib/utils";

import { InventoryFilters } from "./inventory-filters";
import { MovementDialog } from "./movement-dialog";

export const metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const filter = params.filter ?? "all";

  const where: Prisma.VariantWhereInput = { product: { isActive: true } };
  if (q) {
    where.OR = [
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { product: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (filter === "low") {
    // No podemos comparar columnas directo en `where`; lo filtramos en memoria abajo.
  } else if (filter === "out") {
    where.stock = { lte: 0 };
  }

  const variants = await db.variant.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, sku: true, salePrice: true, minStock: true },
      },
    },
    take: 200,
  });

  const filteredVariants =
    filter === "low" ? variants.filter((v) => v.stock <= v.product.minStock && v.stock > 0) : variants;

  // KPIs globales (independientes de los filtros)
  const [totalVariants, lowStock, outOfStock, stockValueAgg] = await Promise.all([
    db.variant.count({ where: { product: { isActive: true } } }),
    db.variant.findMany({
      where: { product: { isActive: true } },
      select: { stock: true, product: { select: { minStock: true } } },
    }),
    db.variant.count({ where: { stock: { lte: 0 }, product: { isActive: true } } }),
    db.variant.findMany({
      where: { product: { isActive: true } },
      select: { stock: true, product: { select: { costPrice: true } } },
    }),
  ]);

  const lowStockCount = lowStock.filter(
    (v) => v.stock > 0 && v.stock <= v.product.minStock,
  ).length;

  const stockValue = stockValueAgg.reduce(
    (sum, v) => sum + v.stock * Number(v.product.costPrice),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Inventario"
        description="Stock por variante. Registra entradas, salidas y ajustes."
        action={
          <Button asChild variant="outline">
            <Link href="/inventory/movements">
              <History className="h-4 w-4" />
              Ver Kardex
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Variantes activas"
          value={String(totalVariants)}
          icon={Boxes}
          accent="primary"
        />
        <KpiCard
          title="Valor de inventario"
          value={formatCurrency(stockValue)}
          icon={ArrowDownUp}
          accent="emerald"
        />
        <KpiCard
          title="Stock bajo"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          accent="amber"
        />
        <KpiCard
          title="Sin stock"
          value={String(outOfStock)}
          icon={AlertTriangle}
          accent="primary"
        />
      </div>

      <InventoryFilters />

      <Card>
        <CardContent className="p-0">
          {filteredVariants.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Boxes}
                title={q ? "Sin resultados" : "Sin variantes que mostrar"}
                description={
                  q
                    ? "Prueba con otro término."
                    : "Crea productos con variantes en la sección Productos."
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor stock</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.map((v) => {
                  const lowStock = v.stock > 0 && v.stock <= v.product.minStock;
                  const out = v.stock <= 0;
                  const value = v.stock * Number(v.product.salePrice);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Link
                          href={`/products/${v.product.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {v.product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{v.size}</span>
                        <span className="mx-1 text-muted-foreground">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          {v.colorHex && (
                            <span
                              className="inline-block h-3 w-3 rounded-full border"
                              style={{ background: v.colorHex }}
                            />
                          )}
                          {v.color}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                      <TableCell className="text-center font-medium">{v.stock}</TableCell>
                      <TableCell>
                        {out ? (
                          <Badge variant="destructive">Sin stock</Badge>
                        ) : lowStock ? (
                          <Badge variant="warning">Stock bajo</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(value)}
                      </TableCell>
                      <TableCell>
                        <MovementDialog
                          variant={{
                            id: v.id,
                            sku: v.sku,
                            size: v.size,
                            color: v.color,
                            stock: v.stock,
                            productName: v.product.name,
                          }}
                        />
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
