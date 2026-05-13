import { z } from "zod";

// ---------- Category ----------
export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(80),
  description: z.string().max(300).optional().or(z.literal("")),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// ---------- Brand ----------
export const brandSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(80),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});
export type BrandInput = z.infer<typeof brandSchema>;

// ---------- Variant ----------
export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU requerido").max(50),
  size: z.string().min(1, "Talla requerida").max(20),
  color: z.string().min(1, "Color requerido").max(40),
  colorHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Hex inválido (ej: #ff3d7a)")
    .optional()
    .or(z.literal("")),
  barcode: z.string().max(60).optional().or(z.literal("")),
  stock: z.coerce.number().int().nonnegative("Stock no puede ser negativo"),
});
export type VariantInput = z.infer<typeof variantSchema>;

// ---------- Product ----------
export const productSchema = z.object({
  sku: z.string().min(1, "SKU requerido").max(50),
  name: z.string().min(1, "Nombre requerido").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z
    .string()
    .url("URL inválida")
    .startsWith("https://", "Debe ser HTTPS")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, "Categoría requerida"),
  brandId: z.string().optional().or(z.literal("")),
  costPrice: z.coerce.number().positive("Precio costo debe ser > 0"),
  salePrice: z.coerce.number().positive("Precio venta debe ser > 0"),
  minStock: z.coerce.number().int().nonnegative().default(5),
  variants: z.array(variantSchema).min(1, "Agrega al menos una variante"),
});
export type ProductInput = z.infer<typeof productSchema>;

// ---------- Inventory movement ----------
export const inventoryMovementSchema = z.object({
  variantId: z.string().min(1, "Variante requerida"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int().positive("Cantidad debe ser > 0"),
  unitCost: z.coerce.number().nonnegative().optional(),
  reason: z.string().max(200).optional().or(z.literal("")),
  reference: z.string().max(80).optional().or(z.literal("")),
});
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
