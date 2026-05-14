import { getSession } from "@/lib/auth";
import { getOpenCashRegisterForUser } from "@/lib/cash-register-queries";

import { CartPanel } from "./cart-panel";
import { MobileCart } from "./mobile-cart";
import { NoCashRegister } from "./no-cash-register";
import { ProductSearch } from "./product-search";

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
    <div className="pb-20 lg:grid lg:h-[calc(100vh-8rem)] lg:grid-cols-[1fr_400px] lg:gap-4 lg:pb-0">
      <div className="flex flex-col lg:min-h-0">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Punto de Venta</h1>
          <span className="text-xs text-muted-foreground">
            Caja {cashRegister.code} · abierta
          </span>
        </div>
        <ProductSearch />
      </div>

      <aside className="hidden min-h-0 lg:block">
        <CartPanel />
      </aside>

      <MobileCart />
    </div>
  );
}
