import Link from "next/link";
import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const DAYS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function DashboardPage() {
  const session = await getSession();

  // ---------- Rangos ----------
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const start7d = new Date(startToday);
  start7d.setDate(start7d.getDate() - 6);

  // ---------- Queries en paralelo ----------
  const [
    todaySales,
    yesterdaySales,
    monthSales,
    prevMonthSales,
    last7Sales,
    recentSales,
    topProducts,
    lowStockVariants,
  ] = await Promise.all([
    db.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startToday } },
      select: { total: true },
    }),
    db.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startYesterday, lt: startToday },
      },
      select: { total: true },
    }),
    db.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startMonth } },
      select: {
        total: true,
        details: {
          select: {
            quantity: true,
            subtotal: true,
            variant: { select: { product: { select: { costPrice: true } } } },
          },
        },
      },
    }),
    db.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startPrevMonth, lte: endPrevMonth },
      },
      select: { total: true },
    }),
    db.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: start7d } },
      select: { total: true, createdAt: true },
    }),
    db.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    db.saleDetail.groupBy({
      by: ["productName"],
      where: { sale: { status: "COMPLETED", createdAt: { gte: startMonth } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.variant.findMany({
      where: {
        product: { isActive: true },
      },
      select: {
        id: true,
        stock: true,
        size: true,
        color: true,
        product: { select: { name: true, minStock: true, id: true } },
      },
    }),
  ]);

  // ---------- Cálculos ----------
  const todayTotal = todaySales.reduce((s, x) => s + Number(x.total), 0);
  const yesterdayTotal = yesterdaySales.reduce((s, x) => s + Number(x.total), 0);
  const monthTotal = monthSales.reduce((s, x) => s + Number(x.total), 0);
  const prevMonthTotal = prevMonthSales.reduce((s, x) => s + Number(x.total), 0);

  // Ganancia estimada del mes (utilidad bruta)
  const monthRevenue = monthSales
    .flatMap((s) => s.details)
    .reduce((sum, d) => sum + Number(d.subtotal), 0);
  const monthCost = monthSales
    .flatMap((s) => s.details)
    .reduce(
      (sum, d) => sum + Number(d.variant.product.costPrice) * d.quantity,
      0,
    );
  const monthProfit = monthRevenue - monthCost;

  const dayDelta = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const monthDelta = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  // Serie 7 días
  const seriesMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startToday);
    d.setDate(d.getDate() - i);
    seriesMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of last7Sales) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (seriesMap.has(key)) {
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + Number(s.total));
    }
  }
  const chartData = Array.from(seriesMap.entries()).map(([date, total]) => ({
    date: DAYS_LABEL[new Date(date + "T12:00:00").getDay()],
    total: Math.round(total * 100) / 100,
  }));

  const lowStockCount = lowStockVariants.filter(
    (v) => v.stock <= v.product.minStock,
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {session?.name?.split(" ")[0] ?? "usuario"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Resumen de tu tienda en tiempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas del día"
          value={formatCurrency(todayTotal)}
          delta={
            yesterdayTotal > 0
              ? {
                  value: `${dayDelta >= 0 ? "+" : ""}${dayDelta.toFixed(1)}% vs ayer`,
                  trend: dayDelta >= 0 ? "up" : "down",
                }
              : undefined
          }
          icon={ShoppingCart}
          accent="primary"
        />
        <KpiCard
          title="Ventas del mes"
          value={formatCurrency(monthTotal)}
          delta={
            prevMonthTotal > 0
              ? {
                  value: `${monthDelta >= 0 ? "+" : ""}${monthDelta.toFixed(1)}% vs mes pasado`,
                  trend: monthDelta >= 0 ? "up" : "down",
                }
              : undefined
          }
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          title="Ganancia del mes"
          value={formatCurrency(monthProfit)}
          icon={DollarSign}
          accent="sky"
        />
        <KpiCard
          title="Stock bajo"
          value={String(lowStockCount)}
          delta={
            lowStockCount > 0
              ? { value: "Revisar inventario", trend: "down" }
              : { value: "Todo OK", trend: "up" }
          }
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesChart data={chartData} />

        <Card>
          <CardHeader>
            <CardTitle>Últimas ventas</CardTitle>
            <CardDescription>Movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSales.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Aún no hay ventas"
                description="Cuando registres ventas en el POS aparecerán aquí."
                className="border-0"
              />
            ) : (
              recentSales.map((s) => {
                const customer = s.customer
                  ? `${s.customer.firstName} ${s.customer.lastName ?? ""}`.trim()
                  : "Cliente sin registro";
                return (
                  <Link
                    key={s.id}
                    href={`/sales/${s.id}`}
                    className="flex items-center justify-between rounded-lg border bg-card/60 p-3 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.code} ·{" "}
                        {formatDateTime(s.createdAt).split(",").slice(1).join(",").trim()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(Number(s.total))}
                    </p>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productos más vendidos</CardTitle>
              <CardDescription>Top 5 del mes</CardDescription>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay ventas suficientes para mostrar top de productos.
            </p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, idx) => (
                <div
                  key={p.productName}
                  className="flex items-center gap-3 rounded-lg border bg-card/40 p-3"
                >
                  <Badge variant="outline" className="h-6 w-6 justify-center p-0">
                    {idx + 1}
                  </Badge>
                  <p className="flex-1 truncate text-sm font-medium">{p.productName}</p>
                  <span className="text-xs text-muted-foreground">
                    {p._sum.quantity ?? 0} uds
                  </span>
                  <span className="w-24 text-right text-sm font-semibold">
                    {formatCurrency(Number(p._sum.subtotal ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
