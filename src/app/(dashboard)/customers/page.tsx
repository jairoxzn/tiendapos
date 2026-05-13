import { Users } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Clientes" };

export default function CustomersPage() {
  return (
    <ComingSoon
      title="Clientes"
      description="CRUD de clientes, historial de compras y fidelización."
      phase="Fase 4"
      icon={Users}
    />
  );
}
