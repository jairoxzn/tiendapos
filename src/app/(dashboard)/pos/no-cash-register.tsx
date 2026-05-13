import Link from "next/link";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NoCashRegister() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Wallet className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Necesitas abrir caja</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Para registrar ventas debes abrir caja con el monto inicial. Esto te permite
              cuadrar el efectivo al cierre del día.
            </p>
          </div>
          <Button asChild>
            <Link href="/cash-register">
              <Wallet className="h-4 w-4" />
              Ir a Caja
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
