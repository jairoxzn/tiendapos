import Image from "next/image";
import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

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
import { formatCurrency } from "@/lib/utils";

import { ProductRowActions } from "./product-row-actions";
import { ProductsFilters } from "./products-filters";

export const metadata = { title: "Productos" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    status?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();

  const where: Prisma.ProductWhereInput = {};
  if (params.status === "active") where.isActive = true;
  else if (params.status === "inactive") where.isActive = false;
  else if (!params.status) where.isActive = true; // default

  if (params.category) where.categoryId = params.category;
  if (params.brand) where.brandId = params.brand;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { stock: true } },
      },
      take: 100,
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo completo con variantes (talla × color) y stock."
        action={
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        }
      />

      <ProductsFilters categories={categories} brands={brands} />

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={PackageSearch}
                title={q ? "Sin resultados" : "Aún no tienes productos"}
                description={
                  q
                    ? "Prueba con otro término o limpia los filtros."
                    : "Crea tu primer producto para empezar a vender."
                }
                action={
                  !q && (
                    <Button asChild>
                      <Link href="/products/new">
                        <Plus className="h-4 w-4" />
                        Crear primer producto
                      </Link>
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                  const lowStock = stock <= p.minStock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-md object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-md bg-muted">
                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {p.variants.length} variante{p.variants.length !== 1 && "s"}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="text-sm">{p.category.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.brand?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(p.salePrice))}
                      </TableCell>
                      <TableCell className="text-center">
                        {lowStock ? (
                          <Badge variant="warning">{stock} ⚠</Badge>
                        ) : (
                          <span className="text-sm">{stock}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProductRowActions product={p} />
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
