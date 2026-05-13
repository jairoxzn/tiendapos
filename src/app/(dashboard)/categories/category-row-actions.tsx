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

import { CategoryDialog } from "./category-dialog";
import { deleteCategoryAction, toggleCategoryAction } from "./actions";

interface Props {
  category: { id: string; name: string; description: string | null; isActive: boolean };
}

export function CategoryRowActions({ category }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleCategoryAction(category.id, !category.isActive);
      if (!res.ok) toast.error(res.error);
      else toast.success(category.isActive ? "Categoría desactivada" : "Categoría activada");
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
        <CategoryDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
          }
          initial={category}
        />
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="h-4 w-4" />
          {category.isActive ? "Desactivar" : "Activar"}
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
          title="¿Eliminar categoría?"
          description={`Se eliminará "${category.name}". Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => deleteCategoryAction(category.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
