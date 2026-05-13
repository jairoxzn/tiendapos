"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
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

import { CustomerDialog } from "./customer-dialog";
import { deleteCustomerAction, toggleCustomerAction } from "./actions";
import type { CustomerInput } from "@/lib/validations/customers";

interface Props {
  customer: {
    id: string;
    docType: CustomerInput["docType"];
    docNumber: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
  };
}

export function CustomerRowActions({ customer }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleCustomerAction(customer.id, !customer.isActive);
      if (!res.ok) toast.error(res.error);
      else toast.success(customer.isActive ? "Cliente desactivado" : "Cliente activado");
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
          <Link href={`/customers/${customer.id}`}>
            <Eye className="h-4 w-4" />
            Ver historial
          </Link>
        </DropdownMenuItem>
        <CustomerDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
          }
          initial={customer}
        />
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="h-4 w-4" />
          {customer.isActive ? "Desactivar" : "Activar"}
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
          title="¿Eliminar cliente?"
          description={`Se eliminará "${customer.firstName} ${customer.lastName ?? ""}". Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => deleteCustomerAction(customer.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
