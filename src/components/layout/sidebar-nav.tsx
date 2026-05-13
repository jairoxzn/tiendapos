"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  PackageSearch,
  Receipt,
  ShoppingBag,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pos", label: "Punto de Venta", icon: ShoppingBag },
    ],
  },
  {
    section: "Catálogo",
    items: [
      { href: "/products", label: "Productos", icon: PackageSearch },
      { href: "/categories", label: "Categorías", icon: Tags },
      { href: "/inventory", label: "Inventario", icon: Boxes },
    ],
  },
  {
    section: "Operación",
    items: [
      { href: "/sales", label: "Ventas", icon: Receipt },
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/cash-register", label: "Caja", icon: Wallet },
    ],
  },
  {
    section: "Administración",
    items: [
      { href: "/reports", label: "Reportes", icon: BarChart3, adminOnly: true },
      { href: "/users", label: "Usuarios", icon: Users, adminOnly: true },
    ],
  },
];

export function SidebarNav({ role }: { role: "ADMIN" | "CASHIER" }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {NAV.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || role === "ADMIN");
        if (items.length === 0) return null;
        return (
          <div key={group.section} className="space-y-1">
            <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-accent"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="relative h-4 w-4 shrink-0" />
                      <span className="relative">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
