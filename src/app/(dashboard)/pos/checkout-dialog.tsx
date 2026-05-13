"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Banknote, CheckCircle2, CreditCard, Loader2, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { round2 } from "@/lib/sales";
import type { PaymentInput } from "@/lib/validations/sales";
import { useCart } from "@/stores/cart-store";

import { createSaleAction } from "./actions";

interface CheckoutDialogProps {
  totals: { subtotal: number; discountAmount: number; taxAmount: number; total: number };
  disabled?: boolean;
}

const METHOD_META: Record<
  PaymentInput["method"],
  { label: string; Icon: typeof Banknote; needsRef: boolean }
> = {
  CASH: { label: "Efectivo", Icon: Banknote, needsRef: false },
  YAPE: { label: "Yape", Icon: Smartphone, needsRef: true },
  PLIN: { label: "Plin", Icon: Smartphone, needsRef: true },
  CARD: { label: "Tarjeta", Icon: CreditCard, needsRef: false },
  TRANSFER: { label: "Transferencia", Icon: CreditCard, needsRef: true },
};

export function CheckoutDialog({ totals, disabled }: CheckoutDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [payments, setPayments] = useState<PaymentInput[]>([
    { method: "CASH", amount: 0, reference: "" },
  ]);
  const [notes, setNotes] = useState("");

  const { lines, generalDiscount, clear } = useCart();

  // Default: setear el monto del primer pago al total al abrir
  useEffect(() => {
    if (open) {
      setPayments([{ method: "CASH", amount: totals.total, reference: "" }]);
      setNotes("");
    }
  }, [open, totals.total]);

  const totalPaid = useMemo(
    () => round2(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)),
    [payments],
  );
  const diff = round2(totalPaid - totals.total);
  const cashGiven = payments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const change = round2(Math.max(0, cashGiven - totals.total));

  function addPayment() {
    setPayments((s) => [...s, { method: "CASH", amount: Math.max(0, -diff), reference: "" }]);
  }

  function updatePayment(idx: number, patch: Partial<PaymentInput>) {
    setPayments((s) => s.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function removePayment(idx: number) {
    setPayments((s) => s.filter((_, i) => i !== idx));
  }

  function handleConfirm() {
    if (Math.abs(diff) > 0.01 && diff < 0) {
      toast.error(`Falta cobrar ${formatCurrency(-diff)}`);
      return;
    }
    // Si hay cambio (efectivo), ajustamos el CASH al monto exacto del total restante
    const normalized = normalizePayments(payments, totals.total);

    startTransition(async () => {
      const res = await createSaleAction({
        customerId: "",
        notes,
        generalDiscount,
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
        })),
        payments: normalized,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Venta ${res.data.code} registrada`);
      clear();
      setOpen(false);
      // Navegamos al detalle para que pueda descargar la boleta
      router.push(`/sales/${res.data.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 className="h-5 w-5" />
        Cobrar {formatCurrency(totals.total)}
      </Button>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
          <DialogDescription>
            Total a cobrar:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totals.total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Métodos de pago</Label>
          {payments.map((p, idx) => {
            const meta = METHOD_META[p.method];
            return (
              <div key={idx} className="space-y-2 rounded-lg border bg-card/40 p-3">
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(METHOD_META) as PaymentInput["method"][]).map((m) => {
                    const Icon = METHOD_META[m].Icon;
                    const active = p.method === m;
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => updatePayment(idx, { method: m })}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {METHOD_META[m].label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Monto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={p.amount}
                      onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">
                      Referencia {meta.needsRef ? "" : "(opcional)"}
                    </Label>
                    <Input
                      placeholder={meta.needsRef ? "Últimos 4 dígitos / # op." : ""}
                      value={p.reference ?? ""}
                      onChange={(e) => updatePayment(idx, { reference: e.target.value })}
                    />
                  </div>
                  {payments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5 text-destructive"
                      onClick={() => removePayment(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={addPayment}>
            <Plus className="h-4 w-4" />
            Agregar método
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Nota (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Observaciones de la venta..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Total venta</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total recibido</span>
            <span className="font-medium">{formatCurrency(totalPaid)}</span>
          </div>
          {diff < 0 && (
            <div className="flex justify-between text-red-500">
              <span>Falta</span>
              <span>{formatCurrency(Math.abs(diff))}</span>
            </div>
          )}
          {change > 0 && (
            <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
              <span>Vuelto</span>
              <span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={pending || diff < -0.01}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Si el efectivo cubre con exceso (vuelto), recortamos el monto del último CASH
 * para que la suma sea exactamente el total y no falle la validación server.
 */
function normalizePayments(payments: PaymentInput[], total: number): PaymentInput[] {
  const nonCash = payments.filter((p) => p.method !== "CASH");
  const cashLines = payments.filter((p) => p.method === "CASH");
  const nonCashTotal = nonCash.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const cashNeeded = Math.max(0, round2(total - nonCashTotal));

  if (cashLines.length === 0) {
    return payments.map((p) => ({ ...p, amount: round2(Number(p.amount) || 0) }));
  }

  // Pone TODO el efectivo necesario en la primera línea CASH, el resto a 0 (resta excedente)
  const adjustedCash = cashLines.map((p, idx) =>
    idx === 0 ? { ...p, amount: cashNeeded } : { ...p, amount: 0 },
  );
  const filtered = adjustedCash.filter((p) => p.amount > 0);
  return [
    ...filtered.map((p) => ({ ...p, amount: round2(p.amount) })),
    ...nonCash.map((p) => ({ ...p, amount: round2(Number(p.amount) || 0) })),
  ];
}
