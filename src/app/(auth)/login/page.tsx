import { Suspense } from "react";

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

      <p className="text-center text-xs text-muted-foreground">
        ¿Olvidaste tu contraseña? Contacta al administrador.
      </p>
    </div>
  );
}
