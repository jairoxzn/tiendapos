import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Reportes" };

export default async function ReportsPage() {
  await requireRole("ADMIN");
  return (
    <ComingSoon
      title="Reportes"
      description="Reportes PDF/Excel: ventas, productos top, ganancias, caja."
      phase="Fase 4"
      icon={BarChart3}
    />
  );
}
