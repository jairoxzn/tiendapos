import { BarChart3, Download, FileSpreadsheet, FileText, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import { DateRangeForm } from "./date-range-form";
import {
  cashRegistersReport,
  parseDateRange,
  profitsReport,
  salesReport,
  topProductsReport,
} from "./queries";

export const metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const range = parseDateRange({ from: params.from, to: params.to });

  const fromStr = range.from.toISOString().slice(0, 10);
  const toStr = range.to.toISOString().slice(0, 10);
  const queryStr = `?from=${fromStr}&to=${toStr}`;

  const [sales, top, profits, registers] = await Promise.all([
    salesReport(range),
    topProductsReport(range, 10),
    profitsReport(range),
    cashRegistersReport(range),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis del negocio con exportes a PDF y Excel. Solo administradores."
      />

      <DateRangeForm initialFrom={fromStr} initialTo={toStr} />

      <Tabs defaultValue={params.tab ?? "sales"} className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max">
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="top">Productos top</TabsTrigger>
            <TabsTrigger value="profits">Ganancias</TabsTrigger>
            <TabsTrigger value="cash">Caja</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Ventas" value={String(sales.totals.count)} />
            <Stat label="Subtotal" value={formatCurrency(sales.totals.subtotal)} />
            <Stat label="IGV" value={formatCurrency(sales.totals.tax)} />
            <Stat label="Total" value={formatCurrency(sales.totals.total)} highlight />
          </div>

          <ExportBar type="sales" query={queryStr} />

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">IGV</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.sales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Sin ventas en el periodo seleccionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.sales.slice(0, 50).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.code}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateTime(s.date)}
                        </TableCell>
                        <TableCell className="text-sm">{s.cashier}</TableCell>
                        <TableCell className="text-sm">{s.customer ?? "—"}</TableCell>
                        <TableCell className="text-center text-sm">{s.items}</TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(s.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(s.tax)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(s.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {sales.sales.length > 50 && (
                <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                  Mostrando 50 de {sales.sales.length} ventas. Exporta para ver todas.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <ExportBar type="top-products" query={queryStr} />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Utilidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Sin datos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    top.map((r, i) => (
                      <TableRow key={r.productId}>
                        <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{r.productName}</TableCell>
                        <TableCell className="text-center font-medium">{r.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(r.cost)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(r.profit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profits" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Ingresos" value={formatCurrency(profits.revenue)} />
            <Stat label="Costo" value={formatCurrency(profits.cost)} />
            <Stat label="Utilidad" value={formatCurrency(profits.profit)} highlight />
            <Stat label="Margen" value={`${profits.margin.toFixed(1)}%`} />
          </div>

          <ExportBar type="profits" query={queryStr} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                En el periodo facturaste{" "}
                <span className="font-semibold">{formatCurrency(profits.revenue)}</span> en
                productos (sin IGV) con un costo total de{" "}
                <span className="font-semibold">{formatCurrency(profits.cost)}</span>.
              </p>
              <p>
                Esto te dejó una utilidad de{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(profits.profit)}
                </span>{" "}
                con un margen de{" "}
                <span className="font-semibold">{profits.margin.toFixed(2)}%</span>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="space-y-4">
          <ExportBar type="cash-registers" query={queryStr} />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead>Abierta</TableHead>
                    <TableHead>Cerrada</TableHead>
                    <TableHead className="text-right">Inicial</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Contado</TableHead>
                    <TableHead className="text-right">Dif.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Sin cajas en el rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    registers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.code}</TableCell>
                        <TableCell className="text-sm">{r.cashier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(r.openedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.closedAt ? formatDateTime(r.closedAt) : "Abierta"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(r.openingAmount)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(r.expectedAmount)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.closingAmount !== null ? formatCurrency(r.closingAmount) : "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${
                            r.difference !== null && Math.abs(r.difference) > 0.005
                              ? r.difference > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-500"
                              : ""
                          }`}
                        >
                          {r.difference !== null
                            ? (r.difference > 0 ? "+" : "") + formatCurrency(r.difference)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={`mt-1 text-xl font-semibold sm:text-2xl ${highlight ? "text-primary" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ExportBar({ type, query }: { type: string; query: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card/40 p-3">
      <div className="flex items-center gap-2 text-sm">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Exporta este reporte</span>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`/api/reports/${type}${query}&format=pdf`} target="_blank" rel="noreferrer">
            <FileText className="h-4 w-4" />
            PDF
            <Download className="h-3 w-3" />
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/reports/${type}${query}&format=xlsx`}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
            <Download className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
