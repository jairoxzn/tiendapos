"use client";

import { useMemo } from "react";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { IGV_PERCENT } from "@/lib/constants";
import { computeTotals } from "@/lib/sales";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";

import { CheckoutDialog } from "./checkout-dialog";

export function CartPanel() {
  const {
    lines,
    generalDiscount,
    updateQuantity,
    updateDiscount,
    removeLine,
    setGeneralDiscount,
    clear,
  } = useCart();

  const totals = useMemo(
    () => computeTotals(lines, generalDiscount, IGV_PERCENT),
    [lines, generalDiscount],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold">Carrito</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
            {lines.length}
          </span>
        </div>
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clear()}>
            <Trash2 className="h-4 w-4" />
            Vaciar
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Carrito vacío"
            description="Busca productos y agrégalos para empezar."
            className="border-0"
          />
        ) : (
          lines.map((l) => {
            const lineSubtotal = Math.max(0, l.unitPrice * l.quantity - l.discount);
            return (
              <div
                key={l.variantId}
                className="rounded-lg border bg-card/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.size} / {l.color}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(l.variantId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const r = updateQuantity(l.variantId, l.quantity - 1);
                        if (!r.ok) toast.error(r.error ?? "");
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{l.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const r = updateQuantity(l.variantId, l.quantity + 1);
                        if (!r.ok) toast.error(r.error ?? "");
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(lineSubtotal)}</p>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Descuento:</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.discount}
                    onChange={(e) => updateDiscount(l.variantId, Number(e.target.value))}
                    className="h-7 w-24 text-xs"
                  />
                  <span className="ml-auto text-muted-foreground">
                    {formatCurrency(l.unitPrice)} c/u
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex-col gap-3 p-4">
        <div className="flex w-full items-center gap-2">
          <span className="text-xs text-muted-foreground">Descuento global:</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={generalDiscount}
            onChange={(e) => setGeneralDiscount(Number(e.target.value))}
            className="h-8 flex-1 text-sm"
            disabled={lines.length === 0}
          />
        </div>

        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {generalDiscount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Descuento</span>
              <span>− {formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>IGV ({IGV_PERCENT}%)</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <CheckoutDialog totals={totals} disabled={lines.length === 0} />
      </CardFooter>
    </Card>
  );
}
