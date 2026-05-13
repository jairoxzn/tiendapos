"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CatalogFiltersProps {
  categories: { id: string; name: string }[];
}

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeCategory = params.get("cat") ?? "";

  function push(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    const str = sp.toString();
    router.push(`/catalogo${str ? `?${str}` : ""}`);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) push({ q: q || undefined });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const isFiltered = q || activeCategory;

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryChip
          active={!activeCategory}
          onClick={() => push({ cat: undefined })}
          label="Todos"
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => push({ cat: c.id })}
            label={c.name}
          />
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              router.push("/catalogo");
            }}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
