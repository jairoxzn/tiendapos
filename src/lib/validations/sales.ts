import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

export const paymentSchema = z.object({
  method: z.enum(["CASH", "YAPE", "PLIN", "CARD", "TRANSFER"]),
  amount: z.coerce.number().positive("Monto debe ser > 0"),
  reference: z.string().max(80).optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const createSaleSchema = z.object({
  customerId: z.string().optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
  generalDiscount: z.coerce.number().nonnegative().default(0),
  lines: z.array(cartLineSchema).min(1, "El carrito está vacío"),
  payments: z.array(paymentSchema).min(1, "Agrega al menos un pago"),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const openCashRegisterSchema = z.object({
  openingAmount: z.coerce.number().nonnegative(),
  notes: z.string().max(200).optional().or(z.literal("")),
});
export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;

export const closeCashRegisterSchema = z.object({
  closingAmount: z.coerce.number().nonnegative(),
  notes: z.string().max(200).optional().or(z.literal("")),
});
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
