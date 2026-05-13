"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changeOwnPasswordAction } from "@/app/(dashboard)/users/actions";

interface FormValues {
  current: string;
  next: string;
  confirm: string;
}

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { current: "", next: "", confirm: "" },
  });

  function onSubmit(values: FormValues) {
    if (values.next.length < 8) {
      setError("next", { message: "Mínimo 8 caracteres" });
      return;
    }
    if (values.next !== values.confirm) {
      setError("confirm", { message: "Las contraseñas no coinciden" });
      return;
    }
    startTransition(async () => {
      const res = await changeOwnPasswordAction(values.current, values.next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Contraseña actualizada");
      reset();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Contraseña actual</Label>
        <Input id="current" type="password" {...register("current", { required: true })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="next">Nueva contraseña</Label>
          <Input id="next" type="password" {...register("next", { required: true })} />
          {errors.next && <p className="text-xs text-red-500">{errors.next.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar</Label>
          <Input id="confirm" type="password" {...register("confirm", { required: true })} />
          {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Cambiar contraseña
      </Button>
    </form>
  );
}
