"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  discount: number; // descuento monetario por línea
  maxStock: number;
}

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  notes: string;
  generalDiscount: number;

  addLine: (line: CartLine) => { ok: boolean; error?: string };
  updateQuantity: (variantId: string, qty: number) => { ok: boolean; error?: string };
  updateDiscount: (variantId: string, discount: number) => void;
  removeLine: (variantId: string) => void;
  setCustomer: (id: string | null) => void;
  setNotes: (notes: string) => void;
  setGeneralDiscount: (n: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customerId: null,
      notes: "",
      generalDiscount: 0,

      addLine: (line) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        if (existing) {
          const newQty = existing.quantity + line.quantity;
          if (newQty > existing.maxStock) {
            return { ok: false, error: `Solo hay ${existing.maxStock} en stock` };
          }
          set((s) => ({
            lines: s.lines.map((l) =>
              l.variantId === line.variantId ? { ...l, quantity: newQty } : l,
            ),
          }));
          return { ok: true };
        }
        if (line.quantity > line.maxStock) {
          return { ok: false, error: `Solo hay ${line.maxStock} en stock` };
        }
        set((s) => ({ lines: [...s.lines, line] }));
        return { ok: true };
      },

      updateQuantity: (variantId, qty) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        if (!line) return { ok: false, error: "Línea no encontrada" };
        if (qty < 1) {
          set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
          return { ok: true };
        }
        if (qty > line.maxStock) {
          return { ok: false, error: `Solo hay ${line.maxStock} en stock` };
        }
        set((s) => ({
          lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l)),
        }));
        return { ok: true };
      },

      updateDiscount: (variantId, discount) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.variantId === variantId ? { ...l, discount: Math.max(0, discount) } : l,
          ),
        })),

      removeLine: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),

      setCustomer: (id) => set({ customerId: id }),
      setNotes: (notes) => set({ notes }),
      setGeneralDiscount: (n) => set({ generalDiscount: Math.max(0, n) }),
      clear: () => set({ lines: [], customerId: null, notes: "", generalDiscount: 0 }),
    }),
    {
      name: "tiendapos-cart",
      version: 1,
    },
  ),
);
