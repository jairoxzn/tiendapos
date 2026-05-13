"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  customerSchema,
  DOC_TYPE_LABELS,
  type CustomerInput,
} from "@/lib/validations/customers";

import { createCustomerAction, updateCustomerAction } from "./actions";

type CustomerInitial = {
  id: string;
  docType: CustomerInput["docType"];
  docNumber: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

interface CustomerDialogProps {
  trigger: React.ReactNode;
  initial?: CustomerInitial;
  onCreated?: (c: { id: string; firstName: string; lastName: string | null; docNumber: string }) => void;
}

const EMPTY: CustomerInput = {
  docType: "DNI",
  docNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

export function CustomerDialog({ trigger, initial, onCreated }: CustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues: CustomerInput = initial
    ? {
        docType: initial.docType,
        docNumber: initial.docNumber,
        firstName: initial.firstName,
        lastName: initial.lastName ?? "",
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        address: initial.address ?? "",
        notes: initial.notes ?? "",
      }
    : EMPTY;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), defaultValues });

  function onSubmit(values: CustomerInput) {
    startTransition(async () => {
      const res = initial
        ? await updateCustomerAction(initial.id, values)
        : await createCustomerAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(initial ? "Cliente actualizado" : "Cliente creado");
      reset(values);
      setOpen(false);
      if (!initial && onCreated && "data" in res && res.data) {
        onCreated(res.data);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset(defaultValues);
      }}
    >
      <div onClick={() => setOpen(true)} className="contents">
        {trigger}
      </div>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>
              Los datos del cliente aparecerán en la boleta y el historial de compras.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Controller
                control={control}
                name="docType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DOC_TYPE_LABELS) as (keyof typeof DOC_TYPE_LABELS)[]).map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {DOC_TYPE_LABELS[t]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docNumber">Número de documento</Label>
              <Input id="docNumber" {...register("docNumber")} />
              {errors.docNumber && (
                <p className="text-xs text-red-500">{errors.docNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombres</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" {...register("lastName")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="+51 999 999 999" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register("notes")} />
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
