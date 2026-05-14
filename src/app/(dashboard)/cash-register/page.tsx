import { Banknote, CheckCircle2, CreditCard, Smartphone, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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

import { getOpenCashRegisterForUser } from "@/lib/cash-register-queries";

import { CloseCashDialog } from "./close-cash-dialog";
import { OpenCashDialog } from "./open-cash-dialog";

export const metadata = { title: "Caja" };
export const dynamic = "force-dynamic";

const METHOD_LABEL = {
  CASH: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
} as const;

const METHOD_ICON = {
  CASH: Banknote,
  YAPE: Smartphone,
  PLIN: Smartphone,
  CARD: CreditCard,
  TRANSFER: CreditCard,
} as const;

export default async function CashRegisterPage() {
  const session = await getSession();
  if (!session) return null;

  const openRegister = await getOpenCashRegisterForUser(session.sub);

  let openSummary: {
    salesCount: number;
    salesTotal: number;
    byMethod: { method: keyof typeof METHOD_LABEL; total: number }[];
    cashIn: number;
    expectedAmount: number;
  } | null = null;

  if (openRegister) {
    const sales = await db.sale.findMany({
      where: { cashRegisterId: openRegister.id, status: "COMPLETED" },
      include: { payments: true },
    });

    const allPayments = sales.flatMap((s) => s.payments);
    const byMethodMap = new Map<keyof typeof METHOD_LABEL, number>();
    for (const p of allPayments) {
      byMethodMap.set(
        p.method,
        (byMethodMap.get(p.method) ?? 0) + Number(p.amount),
      );
    }
    const byMethod = Array.from(byMethodMap.entries()).map(([method, total]) => ({
      method,
      total,
    }));
    const salesTotal = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const cashIn = byMethodMap.get("CASH") ?? 0;

    openSummary = {
      salesCount: sales.length,
      salesTotal,
      byMethod,
      cashIn,
      expectedAmount: Number(openRegister.openingAmount) + cashIn,
    };
  }

  // Historial de cajas cerradas (últimas 20)
  const history = await db.cashRegister.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: 20,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Caja"
        description="Apertura y cierre diario. El sistema cuadra automáticamente."
        action={
          openRegister && openSummary ? (
            <CloseCashDialog
              registerId={openRegister.id}
              expectedAmount={openSummary.expectedAmount}
            />
          ) : (
            <OpenCashDialog />
          )
        }
      />

      {openRegister && openSummary ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle>{openRegister.code}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Abierta {formatDateTime(openRegister.openedAt)}
                  </p>
                </div>
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Abierta
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Monto inicial" value={formatCurrency(Number(openRegister.openingAmount))} />
              <Stat label="Ventas" value={String(openSummary.salesCount)} />
              <Stat label="Total facturado" value={formatCurrency(openSummary.salesTotal)} />
              <Stat
                label="Esperado en caja"
                value={formatCurrency(openSummary.expectedAmount)}
                highlight
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos por método</CardTitle>
            </CardHeader>
            <CardContent>
              {openSummary.byMethod.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay ventas en esta caja.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(Object.keys(METHOD_LABEL) as (keyof typeof METHOD_LABEL)[]).map((m) => {
                    const item = openSummary!.byMethod.find((x) => x.method === m);
                    const Icon = METHOD_ICON[m];
                    return (
                      <div
                        key={m}
                        className="flex items-center gap-3 rounded-lg border bg-card/40 p-3"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{METHOD_LABEL[m]}</p>
                          <p className="font-semibold">{formatCurrency(item?.total ?? 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Wallet className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium">No tienes caja abierta</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Abre la caja del día para empezar a registrar ventas.
              </p>
            </div>
            <OpenCashDialog />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial reciente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">
              Aún no hay cajas cerradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="hidden sm:table-cell">Cajero</TableHead>
                  <TableHead className="hidden md:table-cell">Abierta</TableHead>
                  <TableHead className="hidden md:table-cell">Cerrada</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Inicial</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Esperado</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Contado</TableHead>
                  <TableHead className="text-right">Dif.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((c) => {
                  const diff = Number(c.difference ?? 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        {c.code}
                        <div className="font-sans text-[11px] text-muted-foreground sm:hidden">
                          {c.user.name}
                        </div>
                        <div className="font-sans text-[11px] text-muted-foreground md:hidden">
                          {c.closedAt ? formatDateTime(c.closedAt) : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">{c.user.name}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {formatDateTime(c.openedAt)}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {c.closedAt ? formatDateTime(c.closedAt) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-right lg:table-cell">
                        {formatCurrency(Number(c.openingAmount))}
                      </TableCell>
                      <TableCell className="hidden text-right lg:table-cell">
                        {formatCurrency(Number(c.expectedAmount ?? 0))}
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        {formatCurrency(Number(c.closingAmount ?? 0))}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          Math.abs(diff) < 0.005
                            ? ""
                            : diff > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}
                        {formatCurrency(diff)}
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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
