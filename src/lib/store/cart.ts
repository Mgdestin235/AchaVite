"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "../types";

type CartState = {
  lines: CartLine[];
  promoCode?: string;
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  applyPromo: (code: string) => void;
  clearPromo: () => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promoCode: undefined,
      addItem: (productId, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId ? { ...l, qty: l.qty + qty } : l
              ),
            };
          }
          return { lines: [...state.lines, { productId, qty }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId ? { ...l, qty } : l
                ),
        })),
      applyPromo: (code) => set({ promoCode: code }),
      clearPromo: () => set({ promoCode: undefined }),
      clear: () => set({ lines: [], promoCode: undefined }),
    }),
    { name: "achavite-cart" }
  )
);
