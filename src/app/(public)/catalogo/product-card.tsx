import { MessageCircle, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsappProductLink } from "@/lib/whatsapp";

interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    salePrice: number;
    category: string;
    sizes: string[];
    colors: { color: string; hex: string | null }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const whatsappLink = buildWhatsappProductLink({
    name: product.name,
    sku: product.sku,
    salePrice: product.salePrice,
  });

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <PackageSearch className="h-8 w-8" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        </div>

        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}

        <p className="text-lg font-semibold text-primary">
          {formatCurrency(product.salePrice)}
        </p>

        {/* Variantes disponibles */}
        {(product.sizes.length > 0 || product.colors.length > 0) && (
          <div className="space-y-1.5 text-xs">
            {product.sizes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-muted-foreground">Tallas:</span>
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-input px-1.5 text-[10px] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {product.colors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">Colores:</span>
                {product.colors.map((c) => (
                  <span
                    key={c.color}
                    title={c.color}
                    className="inline-flex items-center gap-1"
                  >
                    {c.hex ? (
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border"
                        style={{ background: c.hex }}
                      />
                    ) : (
                      <span className="text-[10px]">{c.color}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto">
          {whatsappLink ? (
            <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </Button>
          ) : (
            <Button disabled className="w-full" variant="outline">
              Tienda sin WhatsApp configurado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
