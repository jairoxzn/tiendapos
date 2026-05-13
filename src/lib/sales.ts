import { IGV_PERCENT } from "@/lib/constants";

export interface CartLineLike {
  unitPrice: number;
  quantity: number;
  discount?: number;
}

/**
 * Modelo fiscal: los precios listados son SIN IGV.
 * - subtotal = Σ (unitPrice * qty − lineDiscount)
 * - taxAmount = subtotal * IGV%
 * - total = subtotal + taxAmount − generalDiscount
 */
export function computeTotals(
  lines: CartLineLike[],
  generalDiscount = 0,
  igvPercent = IGV_PERCENT,
) {
  const subtotal = lines.reduce(
    (sum, l) => sum + Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0)),
    0,
  );
  const baseAfterDiscount = Math.max(0, subtotal - generalDiscount);
  const taxAmount = round2((baseAfterDiscount * igvPercent) / 100);
  const total = round2(baseAfterDiscount + taxAmount);
  return {
    subtotal: round2(subtotal),
    discountAmount: round2(generalDiscount),
    taxAmount,
    total,
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatSaleCode(seq: number) {
  return `BOL-${String(seq).padStart(6, "0")}`;
}
