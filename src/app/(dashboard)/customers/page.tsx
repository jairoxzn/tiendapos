import { Plus, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";

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
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DOC_TYPE_LABELS } from "@/lib/validations/customers";

import { CustomerDialog } from "./customer-dialog";
import { CustomerRowActions } from "./customer-row-actions";
import { CustomersFilters } from "./customers-filters";

export const metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status ?? "active";

  const where: Prisma.CustomerWhereInput = {};
  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;
  if (q) {
    where.OR = [
      { docNumber: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        select: { total: true },
      },
      _count: { select: { sales: true } },
    },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Clientes"
        description="Base de clientes con historial de compras."
        action={
          <CustomerDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            }
          />
        }
      />

      <CustomersFilters />

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title={q ? "Sin resultados" : "Aún no tienes clientes"}
                description={
                  q
                    ? "Prueba con otro término."
                    : "Registra clientes para asignarlos a las ventas y emitir boletas con sus datos."
                }
                action={
                  !q && (
                    <CustomerDialog
                      trigger={
                        <Button>
                          <Plus className="h-4 w-4" />
                          Registrar primer cliente
                        </Button>
                      }
                    />
                  )
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-center">Compras</TableHead>
                  <TableHead className="text-right">Total comprado</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => {
                  const totalSpent = c.sales.reduce((s, x) => s + Number(x.total), 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">
                        <span className="font-mono text-xs">{c.docNumber}</span>
                        <p className="text-[11px] text-muted-foreground">
                          {DOC_TYPE_LABELS[c.docType as keyof typeof DOC_TYPE_LABELS]}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.firstName} {c.lastName ?? ""}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">{c._count.sales}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalSpent)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        {c.isActive ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <CustomerRowActions
                          customer={{
                            id: c.id,
                            docType: c.docType as "DNI" | "RUC" | "CE" | "PASSPORT",
                            docNumber: c.docNumber,
                            firstName: c.firstName,
                            lastName: c.lastName,
                            email: c.email,
                            phone: c.phone,
                            address: c.address,
                            notes: c.notes,
                            isActive: c.isActive,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
