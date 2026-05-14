import { Plus, Tags } from "lucide-react";

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

import { CategoryDialog } from "./category-dialog";
import { CategoryRowActions } from "./category-row-actions";

export const metadata = { title: "Categorías" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Categorías"
        description="Organiza tus productos por categoría."
        action={
          <CategoryDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nueva categoría
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Tags}
                title="Aún no tienes categorías"
                description="Crea tu primera categoría para empezar a organizar productos."
                action={
                  <CategoryDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4" />
                        Crear primera categoría
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
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Productos</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Creada</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.name}
                      <div className="text-[11px] font-normal text-muted-foreground sm:hidden">
                        {c._count.products} producto{c._count.products !== 1 && "s"} ·{" "}
                        {c.isActive ? "Activa" : "Inactiva"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                      {c.description ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-center text-sm sm:table-cell">
                      {c._count.products}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.isActive ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <CategoryRowActions category={c} />
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
