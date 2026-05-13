import { PackageSearch } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Productos" };

export default function ProductsPage() {
  return (
    <ComingSoon
      title="Productos"
      description="CRUD de productos con tallas, colores, SKU y stock."
      phase="Fase 2"
      icon={PackageSearch}
    />
  );
}
