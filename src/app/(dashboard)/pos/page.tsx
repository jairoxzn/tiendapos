import { getSession } from "@/lib/auth";

import { CartPanel } from "./cart-panel";
import { NoCashRegister } from "./no-cash-register";
import { ProductSearch } from "./product-search";
import { getOpenCashRegisterForUser } from "../cash-register/actions";

export const metadata = { title: "Punto de Venta" };
export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await getSession();
  if (!session) return null;

  const cashRegister = await getOpenCashRegisterForUser(session.sub);

  if (!cashRegister) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Punto de Venta</h1>
          <p className="text-sm text-muted-foreground">
            Caja {session.role === "CASHIER" ? "del cajero" : ""} cerrada.
          </p>
        </div>
        <NoCashRegister />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Punto de Venta</h1>
          <span className="text-xs text-muted-foreground">
            Caja {cashRegister.code} · abierta
          </span>
        </div>
        <ProductSearch />
      </div>
      <div className="min-h-0">
        <CartPanel />
      </div>
    </div>
  );
}
