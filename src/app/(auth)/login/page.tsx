import Link from "next/link";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu cuenta para acceder al panel.
        </p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <div className="space-y-3 text-center">
        <p className="text-xs text-muted-foreground">
          ¿Olvidaste tu contraseña? Contacta al administrador.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Ver catálogo público
        </Link>
      </div>
    </div>
  );
}
