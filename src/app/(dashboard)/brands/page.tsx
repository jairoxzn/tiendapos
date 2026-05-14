import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

import { BrandDialog } from "./brand-dialog";
import { BrandRowActions } from "./brand-row-actions";

export const metadata = { title: "Marcas" };
export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Marcas"
        description="Asocia productos a marcas para reportes y filtros."
        action={
          <BrandDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nueva marca
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          {brands.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Sparkles}
                title="Aún no tienes marcas"
                description="Las marcas son opcionales pero útiles para reportes."
                action={
                  <BrandDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4" />
                        Crear primera marca
                      </Button>
                    }
                  />
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Productos</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Creada</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.logoUrl ? (
                        <Image
                          src={b.logoUrl}
                          alt={b.name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-md object-contain"
                        />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {b.name}
                      <div className="text-[11px] font-normal text-muted-foreground sm:hidden">
                        {b._count.products} producto{b._count.products !== 1 && "s"} ·{" "}
                        {b.isActive ? "Activa" : "Inactiva"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-center text-sm sm:table-cell">
                      {b._count.products}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {b.isActive ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(b.createdAt)}
                    </TableCell>
                    <TableCell>
                      <BrandRowActions brand={b} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
