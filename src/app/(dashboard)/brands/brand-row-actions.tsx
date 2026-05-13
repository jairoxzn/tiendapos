"use client";

import { useTransition } from "react";
import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BrandDialog } from "./brand-dialog";
import { deleteBrandAction, toggleBrandAction } from "./actions";

interface Props {
  brand: { id: string; name: string; logoUrl: string | null; isActive: boolean };
}

export function BrandRowActions({ brand }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleBrandAction(brand.id, !brand.isActive);
      if (!res.ok) toast.error(res.error);
      else toast.success(brand.isActive ? "Marca desactivada" : "Marca activada");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <BrandDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
          }
          initial={brand}
        />
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="h-4 w-4" />
          {brand.isActive ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConfirmDialog
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          }
          title="¿Eliminar marca?"
          description={`Se eliminará "${brand.name}". Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => deleteBrandAction(brand.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
