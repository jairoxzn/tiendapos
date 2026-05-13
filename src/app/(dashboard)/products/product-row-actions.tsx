"use client";

import Link from "next/link";
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

import { deleteProductAction, toggleProductAction } from "./actions";

interface Props {
  product: { id: string; name: string; isActive: boolean };
}

export function ProductRowActions({ product }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleProductAction(product.id, !product.isActive);
      if (!res.ok) toast.error(res.error);
      else toast.success(product.isActive ? "Producto desactivado" : "Producto activado");
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
        <DropdownMenuItem asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="h-4 w-4" />
          {product.isActive ? "Desactivar" : "Activar"}
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
          title="¿Eliminar producto?"
          description={`Se eliminará "${product.name}" y todas sus variantes.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => deleteProductAction(product.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
