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
                  <TableHead>Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
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
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-center text-sm">{b._count.products}</TableCell>
                    <TableCell>
                      {b.isActive ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
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
