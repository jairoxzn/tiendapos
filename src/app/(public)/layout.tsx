import Link from "next/link";
import { MapPin, MessageCircle, Phone, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { EMPRESA } from "@/lib/constants";
import { buildWhatsappStoreLink } from "@/lib/whatsapp";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const whatsappLink = buildWhatsappStoreLink();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/catalogo" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{EMPRESA.nombre}</p>
              <p className="text-[11px] text-muted-foreground">Catálogo</p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {whatsappLink && (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Escríbenos
                </a>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-sm text-muted-foreground sm:grid-cols-3 sm:px-6">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{EMPRESA.nombre}</p>
            {EMPRESA.ruc && <p className="text-xs">RUC: {EMPRESA.ruc}</p>}
          </div>
          {EMPRESA.direccion && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{EMPRESA.direccion}</span>
            </div>
          )}
          {EMPRESA.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href={whatsappLink ?? `tel:${EMPRESA.telefono}`}
                className="hover:text-foreground"
              >
                {EMPRESA.telefono}
              </a>
            </div>
          )}
        </div>
        <div className="border-t py-3 text-center text-[11px] text-muted-foreground">
          Powered by TiendaPOS · <Link href="/login" className="hover:text-foreground">Acceso staff</Link>
        </div>
      </footer>
    </div>
  );
}
