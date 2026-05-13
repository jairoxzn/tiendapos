import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

import { SidebarNav } from "./sidebar-nav";

export function Sidebar({ role }: { role: "ADMIN" | "CASHIER" }) {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card/50 backdrop-blur lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="text-[11px] text-muted-foreground">Tienda de ropa</p>
          </div>
        </Link>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav role={role} />
      </div>
      <Separator />
      <div className="px-6 py-3 text-[11px] text-muted-foreground">
        v0.1 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
