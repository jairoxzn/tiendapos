"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { IGV_PERCENT } from "@/lib/constants";
import { computeTotals } from "@/lib/sales";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";

import { CartPanel } from "./cart-panel";

export function MobileCart() {
  const [open, setOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const generalDiscount = useCart((s) => s.generalDiscount);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );
  const totals = useMemo(
    () => computeTotals(lines, generalDiscount, IGV_PERCENT),
    [lines, generalDiscount],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir carrito"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:hidden"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-background px-1 text-[10px] font-bold text-primary ring-2 ring-primary">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold">
            {formatCurrency(totals.total)}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-2xl p-0 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <CartPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
