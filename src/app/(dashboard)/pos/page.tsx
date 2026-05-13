import { ShoppingBag } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Punto de Venta" };

export default function PosPage() {
  return (
    <ComingSoon
      title="Punto de Venta"
      description="Venta rápida, carrito, escáner y métodos de pago."
      phase="Fase 3"
      icon={ShoppingBag}
    />
  );
}
