import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Ventas" };

export default function SalesPage() {
  return (
    <ComingSoon
      title="Ventas"
      description="Historial de ventas con detalle, reimpresión y devoluciones."
      phase="Fase 3"
      icon={Receipt}
    />
  );
}
