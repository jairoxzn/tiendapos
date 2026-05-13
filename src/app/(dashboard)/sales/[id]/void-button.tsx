"use client";

import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { voidSaleAction } from "../../pos/actions";

export function VoidButton({ saleId, code }: { saleId: string; code: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <Ban className="h-4 w-4" />
          Anular venta
        </Button>
      }
      title="¿Anular esta venta?"
      description={`Se anulará la venta ${code} y el stock se devolverá automáticamente al inventario.`}
      confirmLabel="Sí, anular"
      destructive
      onConfirm={async () => {
        const res = await voidSaleAction(saleId);
        if (!res.ok) {
          toast.error(res.error);
          return res;
        }
        toast.success("Venta anulada");
        router.refresh();
        return res;
      }}
    />
  );
}
