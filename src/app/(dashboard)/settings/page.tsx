import { Building2, KeyRound, Settings as SettingsIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth";
import { EMPRESA, IGV_PERCENT, APP_NAME, APP_URL } from "@/lib/constants";

import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos de empresa y preferencias generales."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estos datos aparecen en la boleta y reportes. Para editarlos, modifica las
            variables <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_EMPRESA_*</code>{" "}
            en <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> y reinicia el servidor.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" value={EMPRESA.nombre} />
            <Field label="RUC" value={EMPRESA.ruc} />
            <Field label="Dirección" value={EMPRESA.direccion} />
            <Field label="Teléfono" value={EMPRESA.telefono} />
            <Field label="IGV (%)" value={`${IGV_PERCENT}%`} />
            <Field label="URL" value={APP_URL} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="h-4 w-4" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="App" value={APP_NAME} />
          <Field label="Versión" value="0.4.0" />
          <Field label="Tu rol" value={session?.role === "ADMIN" ? "Administrador" : "Cajero"} />
          <Field label="Tu correo" value={session?.email ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Cambiar tu contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}
