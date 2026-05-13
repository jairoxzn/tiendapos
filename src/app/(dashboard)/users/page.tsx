import { Users } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  await requireRole("ADMIN");
  return (
    <ComingSoon
      title="Usuarios"
      description="Gestión de cuentas: administradores y cajeros."
      phase="Fase 4"
      icon={Users}
    />
  );
}
