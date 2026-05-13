import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { EMPRESA } from "@/lib/constants";

import { CatalogFilters } from "./catalog-filters";
import { ProductCard } from "./product-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Catálogo · ${EMPRESA.nombre}`,
  description: `Catálogo de productos disponibles en ${EMPRESA.nombre}. Consulta por WhatsApp.`,
  openGraph: {
    title: `${EMPRESA.nombre} · Catálogo`,
    description: `Mira los productos disponibles y consulta por WhatsApp.`,
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ q?: string; cat?: string }>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const cat = params.cat;

  // Solo productos activos con al menos una variante con stock > 0
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    variants: { some: { stock: { gt: 0 }, isActive: true } },
  };
  if (cat) where.categoryId = cat;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        variants: {
          where: { isActive: true, stock: { gt: 0 } },
          select: { size: true, color: true, colorHex: true },
        },
      },
      take: 60,
    }),
    db.category.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Deduplicar tallas/colores por producto
  const mapped = products.map((p) => {
    const sizes = Array.from(new Set(p.variants.map((v) => v.size)));
    const colorsMap = new Map<string, string | null>();
    for (const v of p.variants) {
      if (!colorsMap.has(v.color)) colorsMap.set(v.color, v.colorHex);
    }
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      salePrice: Number(p.salePrice),
      category: p.category.name,
      sizes,
      colors: Array.from(colorsMap.entries()).map(([color, hex]) => ({ color, hex })),
    };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Nuestro catálogo
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Descubre los productos disponibles. ¿Te interesa alguno?{" "}
          <span className="font-medium text-foreground">Escríbenos por WhatsApp.</span>
        </p>
      </div>

      <CatalogFilters categories={categories} />

      {mapped.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={q || cat ? "Sin productos que coincidan" : "Catálogo vacío"}
          description={
            q || cat
              ? "Prueba con otra búsqueda o categoría."
              : "Pronto subiremos productos. Vuelve más tarde."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mapped.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <p className="pt-4 text-center text-xs text-muted-foreground">
        Mostrando {mapped.length} producto{mapped.length === 1 ? "" : "s"} disponibles
      </p>
    </div>
  );
}
