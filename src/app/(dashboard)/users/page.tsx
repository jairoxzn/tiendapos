import { Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";

import { UserDialog } from "./user-dialog";
import { UserRowActions } from "./user-row-actions";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireRole("ADMIN");

  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Usuarios"
        description="Administra cuentas de acceso. Solo administradores."
        action={
          <UserDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nuevo usuario
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Sin usuarios" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Correo</TableHead>
                  <TableHead className="hidden sm:table-cell">Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Último ingreso</TableHead>
                  <TableHead className="hidden lg:table-cell">Creado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.id === session.sub && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Tú
                        </Badge>
                      )}
                      <div className="text-[11px] font-normal text-muted-foreground md:hidden">
                        {u.email}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : "secondary"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {u.role === "ADMIN" ? "Admin" : "Cajero"}
                        </Badge>
                        {u.isActive ? (
                          <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {u.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role === "ADMIN" ? "Administrador" : "Cajero"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {u.isActive ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Nunca"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <UserRowActions user={u} currentUserId={session.sub} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
