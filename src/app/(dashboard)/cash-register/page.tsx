import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Caja" };

export default function CashRegisterPage() {
  return (
    <ComingSoon
      title="Caja"
      description="Apertura y cierre de caja con cuadre y reporte diario."
      phase="Fase 3"
      icon={Wallet}
    />
  );
}
