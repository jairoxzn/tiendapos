import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

import { ProductForm } from "../../product-form";

export const metadata = { title: "Editar producto" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { variants: { orderBy: [{ size: "asc" }, { color: "asc" }] } },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const defaultValues = {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    minStock: product.minStock,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex ?? "",
      barcode: v.barcode ?? "",
      stock: v.stock,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar producto</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        defaultValues={defaultValues}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
