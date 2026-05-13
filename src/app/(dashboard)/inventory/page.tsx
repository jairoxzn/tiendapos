import { Boxes } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Inventario" };

export default function InventoryPage() {
  return (
    <ComingSoon
      title="Inventario"
      description="Kardex, entradas, salidas, ajustes y alertas de stock."
      phase="Fase 2"
      icon={Boxes}
    />
  );
}
