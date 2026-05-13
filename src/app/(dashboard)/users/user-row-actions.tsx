"use client";

import { KeyRound, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserDialog } from "./user-dialog";
import { deleteUserAction } from "./actions";

interface Props {
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "CASHIER";
    isActive: boolean;
  };
  currentUserId: string;
}

export function UserRowActions({ user, currentUserId }: Props) {
  const isSelf = user.id === currentUserId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <UserDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
          }
          initial={user}
        />
        <ResetPasswordDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <KeyRound className="h-4 w-4" />
              Restablecer contraseña
            </DropdownMenuItem>
          }
          userId={user.id}
          userName={user.name}
        />
        {!isSelf && (
          <>
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
              title="¿Eliminar usuario?"
              description={`Se eliminará la cuenta de "${user.name}". Si ya tiene ventas asociadas, el sistema lo bloqueará.`}
              confirmLabel="Eliminar"
              destructive
              onConfirm={() => deleteUserAction(user.id)}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
