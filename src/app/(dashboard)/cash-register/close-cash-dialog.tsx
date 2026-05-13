"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogOut } from "lucide-react";
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
import {
  closeCashRegisterSchema,
  type CloseCashRegisterInput,
} from "@/lib/validations/sales";
import { formatCurrency } from "@/lib/utils";

import { closeCashRegisterAction } from "./actions";

interface CloseCashDialogProps {
  registerId: string;
  expectedAmount: number;
}

export function CloseCashDialog({ registerId, expectedAmount }: CloseCashDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CloseCashRegisterInput>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: { closingAmount: expectedAmount, notes: "" },
  });

  const closing = Number(watch("closingAmount") ?? 0);
  const diff = closing - expectedAmount;

  function onSubmit(values: CloseCashRegisterInput) {
    startTransition(async () => {
      const res = await closeCashRegisterAction(registerId, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Caja cerrada");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <LogOut className="h-4 w-4" />
        Cerrar caja
      </Button>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Cerrar caja</DialogTitle>
            <DialogDescription>
              Cuenta el efectivo físico y registra el monto. El sistema calculará la
              diferencia contra lo esperado.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Esperado en caja</span>
              <span className="font-medium">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closingAmount">Efectivo contado (S/)</Label>
            <Input
              id="closingAmount"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              {...register("closingAmount")}
            />
            {errors.closingAmount && (
              <p className="text-xs text-red-500">{errors.closingAmount.message}</p>
            )}
            {Math.abs(diff) > 0.005 && (
              <p
                className={`text-xs font-medium ${
                  diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                }`}
              >
                Diferencia: {diff > 0 ? "+" : ""}
                {formatCurrency(diff)} {diff > 0 ? "(sobrante)" : "(faltante)"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Textarea id="notes" placeholder="Observaciones del cierre" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} variant="destructive">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar cierre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
