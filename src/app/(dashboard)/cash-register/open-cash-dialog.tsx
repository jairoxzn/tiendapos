"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wallet } from "lucide-react";
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
  openCashRegisterSchema,
  type OpenCashRegisterInput,
} from "@/lib/validations/sales";

import { openCashRegisterAction } from "./actions";

export function OpenCashDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpenCashRegisterInput>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: { openingAmount: 0, notes: "" },
  });

  function onSubmit(values: OpenCashRegisterInput) {
    startTransition(async () => {
      const res = await openCashRegisterAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Caja abierta");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Wallet className="h-4 w-4" />
        Abrir caja
      </Button>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Abrir caja</DialogTitle>
            <DialogDescription>
              Indica el monto de efectivo con el que inicia la caja del día.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="openingAmount">Monto inicial (S/)</Label>
            <Input
              id="openingAmount"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              {...register("openingAmount")}
            />
            {errors.openingAmount && (
              <p className="text-xs text-red-500">{errors.openingAmount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Nota (opcional)</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Abrir caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
