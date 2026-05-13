import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
}

export function ComingSoon({ title, description, phase, icon: Icon }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">Módulo en construcción</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Esta sección se entrega en {phase}. Por ahora puedes navegar el resto del panel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
