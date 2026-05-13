import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Receipt, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DOC_TYPE_LABELS } from "@/lib/validations/customers";

export const metadata = { title: "Cliente" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { details: true } } },
      },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.sales
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + Number(s.total), 0);
  const completedCount = customer.sales.filter((s) => s.status === "COMPLETED").length;
  const avgTicket = completedCount > 0 ? totalSpent / completedCount : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.firstName} {customer.lastName ?? ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {DOC_TYPE_LABELS[customer.docType as keyof typeof DOC_TYPE_LABELS]}:{" "}
            <span className="font-mono">{customer.docNumber}</span>
          </p>
        </div>
        {!customer.isActive && (
          <Badge variant="secondary" className="ml-auto">
            Inactivo
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
            <InfoRow icon={Mail} label="Email" value={customer.email} />
            <InfoRow icon={MapPin} label="Dirección" value={customer.address} className="sm:col-span-2" />
            <InfoRow
              icon={Calendar}
              label="Registrado"
              value={formatDateTime(customer.createdAt)}
              className="sm:col-span-2"
            />
            {customer.notes && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm sm:col-span-2">
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Notas
                </p>
                <p>{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Stat label="Total comprado" value={formatCurrency(totalSpent)} highlight />
            <Stat label="Compras" value={String(completedCount)} />
            <Stat label="Ticket promedio" value={formatCurrency(avgTicket)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Historial de compras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customer.sales.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title="Sin compras todavía"
                description="Cuando este cliente compre, sus ventas aparecerán aquí."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/sales/${s.id}`} className="hover:underline">
                        {s.code}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(s.createdAt)}
                    </TableCell>
                    <TableCell className="text-center text-sm">{s._count.details}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(s.total))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "COMPLETED"
                            ? "success"
                            : s.status === "REFUNDED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {s.status}
                      </Badge>
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

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2 ${className ?? ""}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card/40 p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-base font-semibold ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
