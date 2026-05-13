"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownUp, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  inventoryMovementSchema,
  type InventoryMovementInput,
} from "@/lib/validations/catalog";

import { createMovementAction } from "./actions";

interface MovementDialogProps {
  variant: {
    id: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    productName: string;
  };
}

const TYPE_LABELS: Record<InventoryMovementInput["type"], string> = {
  IN: "Entrada (compra/reposición)",
  OUT: "Salida (merma/regalo)",
  RETURN: "Devolución (de cliente)",
  ADJUSTMENT: "Ajuste a stock final",
};

export function MovementDialog({ variant }: MovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<InventoryMovementInput>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: {
      variantId: variant.id,
      type: "IN",
      quantity: 1,
      reason: "",
      reference: "",
    },
  });

  const type = watch("type");

  function onSubmit(values: InventoryMovementInput) {
    startTransition(async () => {
      const res = await createMovementAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Movimiento registrado");
      reset({ variantId: variant.id, type: "IN", quantity: 1, reason: "", reference: "" });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <ArrowDownUp className="h-4 w-4" />
        <span className="sr-only">Registrar movimiento</span>
      </Button>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{variant.productName}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              <span>
                {variant.size} / {variant.color}
              </span>
              <span className="mx-1 text-muted-foreground">·</span>
              <span className="text-muted-foreground">Stock actual: {variant.stock}</span>
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" {...register("variantId")} />

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as InventoryMovementInput["type"][]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {type === "ADJUSTMENT" ? "Stock final deseado" : "Cantidad"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-xs text-red-500">{errors.quantity.message}</p>
              )}
            </div>
            {type === "IN" && (
              <div className="space-y-2">
                <Label htmlFor="unitCost">Costo unitario (opcional)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("unitCost")}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia (opcional)</Label>
            <Input id="reference" placeholder="# guía, factura..." {...register("reference")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo / nota</Label>
            <Textarea id="reason" placeholder="Detalle del movimiento" {...register("reason")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
