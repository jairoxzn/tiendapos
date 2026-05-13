"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InventoryFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const filter = params.get("filter") ?? "all";

  function push(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/inventory?${sp.toString()}`);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) push({ q: q || undefined });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar SKU, código o producto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filter} onValueChange={(v) => push({ filter: v })}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las variantes</SelectItem>
          <SelectItem value="low">Stock bajo</SelectItem>
          <SelectItem value="out">Sin stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
