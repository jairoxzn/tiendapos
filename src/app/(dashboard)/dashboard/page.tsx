import { AlertTriangle, DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

// Datos de muestra mientras conectamos a Prisma con datos reales en Fase 2-3.
const MOCK_CHART = [
  { date: "Lun", total: 480 },
  { date: "Mar", total: 720 },
  { date: "Mié", total: 540 },
  { date: "Jue", total: 980 },
  { date: "Vie", total: 1320 },
  { date: "Sáb", total: 1780 },
  { date: "Dom", total: 1120 },
];

const MOCK_RECENT = [
  { code: "BOL-000123", customer: "María Pérez", total: 189.9, time: "10:42" },
  { code: "BOL-000122", customer: "Cliente sin registro", total: 79.0, time: "10:15" },
  { code: "BOL-000121", customer: "Lucía Ramos", total: 299.5, time: "09:58" },
  { code: "BOL-000120", customer: "Andrés Soto", total: 120.0, time: "09:21" },
];

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {session?.name?.split(" ")[0] ?? "usuario"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu tienda. Los datos se conectarán a la base real en la Fase 2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas del día"
          value={formatCurrency(1320.5)}
          delta={{ value: "+12.4% vs ayer", trend: "up" }}
          icon={ShoppingCart}
          accent="primary"
        />
        <KpiCard
          title="Ventas del mes"
          value={formatCurrency(28450)}
          delta={{ value: "+8.1% vs mes pasado", trend: "up" }}
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          title="Ganancia estimada"
          value={formatCurrency(9870)}
          delta={{ value: "+3.2%", trend: "up" }}
          icon={DollarSign}
          accent="sky"
        />
        <KpiCard
          title="Productos con stock bajo"
          value="7"
          delta={{ value: "Revisar inventario", trend: "down" }}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesChart data={MOCK_CHART} />

        <Card>
          <CardHeader>
            <CardTitle>Últimas ventas</CardTitle>
            <CardDescription>Movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_RECENT.map((r) => (
              <div
                key={r.code}
                className="flex items-center justify-between rounded-lg border bg-card/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.code} · {r.time}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(r.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productos más vendidos</CardTitle>
              <CardDescription>Top 5 del periodo</CardDescription>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta sección se llenará automáticamente cuando registres ventas en la Fase 3 (POS).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
