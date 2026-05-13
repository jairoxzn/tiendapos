"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductsFiltersProps {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export function ProductsFilters({ categories, brands }: ProductsFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "__all__";
  const brand = params.get("brand") ?? "__all__";
  const status = params.get("status") ?? "active";

  function pushParams(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "__all__") sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => router.push(`/products?${sp.toString()}`));
  }

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) pushParams({ q: q || undefined });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const isFiltered = q || category !== "__all__" || brand !== "__all__" || status !== "active";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={category} onValueChange={(v) => pushParams({ category: v })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas las categorías</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={brand} onValueChange={(v) => pushParams({ brand: v })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Marca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas las marcas</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => pushParams({ status: v })}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.push("/products");
          }}
          disabled={pending}
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
