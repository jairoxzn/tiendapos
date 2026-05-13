"use client";

import { useEffect, useState, useTransition } from "react";
import { PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";

import { searchProductsForPos, type ProductSearchResult } from "./actions";

export function ProductSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const addLine = useCart((s) => s.addLine);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const data = await searchProductsForPos(q);
        setResults(data);
        // Auto-select primera variante con stock para cada producto
        const next: Record<string, string> = {};
        for (const p of data) {
          const firstAvailable = p.variants.find((v) => v.stock > 0);
          if (firstAvailable) next[p.id] = firstAvailable.id;
        }
        setSelected(next);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  const showEmpty = !loading && results.length === 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Buscar producto por nombre, SKU o código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading && results.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={PackageSearch}
            title={q ? "Sin resultados" : "Empieza a buscar"}
            description={
              q
                ? "Prueba con otro nombre o código."
                : "Escribe nombre, SKU o código de barras para encontrar productos."
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((p) => {
              const variantId = selected[p.id];
              const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0];
              const hasStock = variant && variant.stock > 0;
              return (
                <Card
                  key={p.id}
                  className={`overflow-hidden transition-all ${
                    hasStock ? "cursor-pointer hover:shadow-lg" : "opacity-60"
                  }`}
                >
                  <CardContent className="space-y-3 p-3">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <PackageSearch className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                        <p className="text-base font-semibold">{formatCurrency(p.salePrice)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {p.variants.map((v) => {
                        const active = v.id === variantId;
                        const empty = v.stock <= 0;
                        return (
                          <button
                            key={v.id}
                            disabled={empty}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!empty) setSelected((s) => ({ ...s, [p.id]: v.id }));
                            }}
                            className={`group flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-input hover:bg-accent"
                            } ${empty ? "cursor-not-allowed opacity-40" : ""}`}
                            title={empty ? "Sin stock" : `${v.stock} disponibles`}
                          >
                            {v.colorHex && (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full border"
                                style={{ background: v.colorHex }}
                              />
                            )}
                            {v.size}/{v.color}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!hasStock}
                      onClick={() => {
                        if (!variant) return;
                        const res = addLine({
                          variantId: variant.id,
                          productId: p.id,
                          productName: p.name,
                          variantSku: variant.sku,
                          size: variant.size,
                          color: variant.color,
                          unitPrice: p.salePrice,
                          quantity: 1,
                          discount: 0,
                          maxStock: variant.stock,
                        });
                        if (!res.ok) toast.error(res.error ?? "No se pudo agregar");
                        else toast.success(`${p.name} agregado`);
                      }}
                      className="w-full rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hasStock ? "Agregar al carrito" : "Sin stock"}
                    </button>

                    {variant && (
                      <div className="text-[10px] text-muted-foreground">
                        Stock: {variant.stock} · {variant.sku}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
