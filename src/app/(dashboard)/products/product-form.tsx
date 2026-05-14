"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { productSchema, type ProductInput } from "@/lib/validations/catalog";

import { createProductAction, updateProductAction } from "./actions";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  defaultValues?: ProductInput;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

const EMPTY_VARIANT = {
  sku: "",
  size: "",
  color: "",
  colorHex: "",
  barcode: "",
  stock: 0,
};

export function ProductForm({
  mode,
  productId,
  defaultValues,
  categories,
  brands,
}: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues ?? {
      sku: "",
      name: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      brandId: "",
      costPrice: 0,
      salePrice: 0,
      minStock: 5,
      variants: [EMPTY_VARIANT],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const imageUrl = watch("imageUrl");

  function onSubmit(values: ProductInput) {
    startTransition(async () => {
      const res =
        mode === "edit" && productId
          ? await updateProductAction(productId, values)
          : await createProductAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "Producto actualizado" : "Producto creado");
      router.push("/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" placeholder="POLO-OS-001" {...register("sku")} />
                {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Polo Oversize Premium" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Polo de algodón pima, corte oversize..."
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-xs text-red-500">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Marca (opcional)</Label>
                <Controller
                  control={control}
                  name="brandId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin marca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Sin marca —</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Precio costo (S/)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("costPrice")}
                />
                {errors.costPrice && (
                  <p className="text-xs text-red-500">{errors.costPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Precio venta (S/)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("salePrice")}
                />
                {errors.salePrice && (
                  <p className="text-xs text-red-500">{errors.salePrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock mínimo</Label>
                <Input id="minStock" type="number" min="0" {...register("minStock")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL externa (HTTPS)</Label>
              <Input
                id="imageUrl"
                placeholder="https://..."
                {...register("imageUrl")}
              />
              {errors.imageUrl && (
                <p className="text-xs text-red-500">{errors.imageUrl.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Pega un link público de Instagram, Drive, Imgur, etc.
              </p>
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              {imageUrl ? (
                // Use plain img to avoid Next/Image errors with invalid URLs during typing
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  Vista previa
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Variantes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Talla × color × stock. Cada variante tiene su propio SKU y código de barras.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => append(EMPTY_VARIANT)}
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid items-end gap-3 rounded-lg border bg-card/40 p-3 md:grid-cols-[1.2fr_0.8fr_1fr_0.6fr_1fr_0.6fr_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs">SKU variante</Label>
                <Input placeholder="POLO-OS-001-M-NEG" {...register(`variants.${idx}.sku`)} />
                {errors.variants?.[idx]?.sku && (
                  <p className="text-[10px] text-red-500">
                    {errors.variants[idx]?.sku?.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Talla</Label>
                <Input placeholder="M" {...register(`variants.${idx}.size`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input placeholder="Negro" {...register(`variants.${idx}.color`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hex</Label>
                <Input placeholder="#000000" {...register(`variants.${idx}.colorHex`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Código barras</Label>
                <Input
                  placeholder="Opcional"
                  {...register(`variants.${idx}.barcode`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input
                  type="number"
                  min="0"
                  {...register(`variants.${idx}.stock`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => fields.length > 1 && remove(idx)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.variants && typeof errors.variants.message === "string" && (
            <p className="text-xs text-red-500">{errors.variants.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
