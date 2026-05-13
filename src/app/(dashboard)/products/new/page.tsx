import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

import { ProductForm } from "../product-form";

export const metadata = { title: "Nuevo producto" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuevo producto</h1>
          <p className="text-sm text-muted-foreground">
            Define el producto base y al menos una variante (talla × color).
          </p>
        </div>
      </div>

      <ProductForm mode="create" categories={categories} brands={brands} />
    </div>
  );
}
