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
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryInput } from "@/lib/validations/catalog";

import { createCategoryAction, updateCategoryAction } from "./actions";

interface CategoryDialogProps {
  trigger: React.ReactNode;
  initial?: { id: string; name: string; description: string | null };
}

export function CategoryDialog({ trigger, initial }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    },
  });

  function onSubmit(values: CategoryInput) {
    startTransition(async () => {
      const res = initial
        ? await updateCategoryAction(initial.id, values)
        : await createCategoryAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(initial ? "Categoría actualizada" : "Categoría creada");
      reset(values);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset({ name: initial?.name ?? "", description: initial?.description ?? "" });
      }}
    >
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            <DialogDescription>
              Agrupa tus productos. El slug se genera automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej: Polos" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Polos casuales y deportivos"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
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
