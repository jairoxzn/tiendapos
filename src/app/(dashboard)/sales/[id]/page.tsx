import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Receipt,
  ReceiptText,
  Smartphone,
  User,
} from "lucide-react";
import type { PaymentMethod, SaleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import { VoidButton } from "./void-button";

export const metadata = { title: "Detalle de venta" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<SaleStatus, { label: string; variant: "success" | "destructive" | "warning" | "secondary" }> =
  {
    COMPLETED: { label: "Completada", variant: "success" },
    REFUNDED: { label: "Anulada", variant: "destructive" },
    CANCELLED: { label: "Cancelada", variant: "secondary" },
    PENDING: { label: "Pendiente", variant: "warning" },
  };

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  CASH: Banknote,
  YAPE: Smartphone,
  PLIN: Smartphone,
  CARD: CreditCard,
  TRANSFER: CreditCard,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      customer: true,
      details: true,
      payments: true,
      cashRegister: { select: { code: true } },
    },
  });

  if (!sale) notFound();

  const meta = STATUS_META[sale.status];
  const customerName = sale.customer
    ? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim()
    : "Cliente genérico";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {sale.code}
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {formatDateTime(sale.createdAt)} · {sale.user.name}
              {sale.cashRegister?.code && ` · ${sale.cashRegister.code}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/sales/${sale.id}/nota-venta`} target="_blank" rel="noreferrer">
              <ReceiptText className="h-4 w-4" />
              Nota de Venta
            </a>
          </Button>
          {sale.status === "COMPLETED" && session?.role === "ADMIN" && (
            <VoidButton saleId={sale.id} code={sale.code} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Variante</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">P. unit.</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Desc.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.details.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.productName}
                      <div className="text-[11px] font-normal text-muted-foreground md:hidden">
                        {d.variantInfo}
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground sm:hidden">
                        {formatCurrency(Number(d.unitPrice))} c/u
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{d.variantInfo}</TableCell>
                    <TableCell className="text-center">{d.quantity}</TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {formatCurrency(Number(d.unitPrice))}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                      {Number(d.discount) > 0 ? formatCurrency(Number(d.discount)) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(d.subtotal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="space-y-1 p-4 text-sm sm:p-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(sale.subtotal))}</span>
              </div>
              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Descuento</span>
                  <span>− {formatCurrency(Number(sale.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>IGV</span>
                <span>{formatCurrency(Number(sale.taxAmount))}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(Number(sale.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{customerName}</p>
              {sale.customer && (
                <p className="text-muted-foreground">
                  {sale.customer.docType}: {sale.customer.docNumber}
                </p>
              )}
              {sale.notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground">Nota</p>
                  <p>{sale.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sale.payments.map((p) => {
                const Icon = METHOD_ICON[p.method];
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{METHOD_LABEL[p.method]}</p>
                        {p.reference && (
                          <p className="text-[11px] text-muted-foreground">{p.reference}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
