"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";

import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ role }: { role: "ADMIN" | "CASHIER" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-72 max-w-[85vw] flex-col p-0 sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SheetDescription className="sr-only">
          Navegar entre las secciones del sistema.
        </SheetDescription>
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
      </SheetContent>
    </Sheet>
  );
}
