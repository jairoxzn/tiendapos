"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { brandSchema, type BrandInput } from "@/lib/validations/catalog";

import { createBrandAction, updateBrandAction } from "./actions";

interface BrandDialogProps {
  trigger: React.ReactNode;
  initial?: { id: string; name: string; logoUrl: string | null };
}

export function BrandDialog({ trigger, initial }: BrandDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: initial?.name ?? "", logoUrl: initial?.logoUrl ?? "" },
  });

  function onSubmit(values: BrandInput) {
    startTransition(async () => {
      const res = initial
        ? await updateBrandAction(initial.id, values)
        : await createBrandAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(initial ? "Marca actualizada" : "Marca creada");
      reset(values);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset({ name: initial?.name ?? "", logoUrl: initial?.logoUrl ?? "" });
      }}
    >
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Editar marca" : "Nueva marca"}</DialogTitle>
            <DialogDescription>
              Asigna marcas a tus productos. El logo es opcional (URL externa HTTPS).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej: Nike" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del logo (opcional)</Label>
            <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
            {errors.logoUrl && <p className="text-xs text-red-500">{errors.logoUrl.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
