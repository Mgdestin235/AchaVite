"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATEGORIES, DELIVERY_ZONES, PRODUCTS, PROMOS } from "../data";
import { orderCode } from "../format";
import type {
  DeliveryZone,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Promo,
} from "../types";

type NewOrderInput = {
  customer: Order["customer"];
  items: OrderItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  total: number;
  deliveryMode: Order["deliveryMode"];
  relaisPoint?: string;
  paymentMethod: PaymentMethod;
};

type ShopState = {
  products: Product[];
  promos: Promo[];
  zones: DeliveryZone[];
  orders: Order[];

  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addPromo: (p: Promo) => void;
  updatePromo: (code: string, patch: Partial<Promo>) => void;
  deletePromo: (code: string) => void;

  updateZone: (city: string, patch: Partial<DeliveryZone>) => void;
  addZone: (z: DeliveryZone) => void;
  deleteZone: (city: string) => void;

  createOrder: (input: NewOrderInput) => Order;
  setOrderPaymentStatus: (id: string, status: PaymentStatus, method?: PaymentMethod) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  findOrder: (codeOrPhone: string) => Order | undefined;
};

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      products: PRODUCTS,
      promos: PROMOS,
      zones: DELIVERY_ZONES,
      orders: [],

      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addPromo: (p) => set((s) => ({ promos: [p, ...s.promos] })),
      updatePromo: (code, patch) =>
        set((s) => ({
          promos: s.promos.map((p) => (p.code === code ? { ...p, ...patch } : p)),
        })),
      deletePromo: (code) =>
        set((s) => ({ promos: s.promos.filter((p) => p.code !== code) })),

      updateZone: (city, patch) =>
        set((s) => ({
          zones: s.zones.map((z) => (z.city === city ? { ...z, ...patch } : z)),
        })),
      addZone: (z) => set((s) => ({ zones: [...s.zones, z] })),
      deleteZone: (city) =>
        set((s) => ({ zones: s.zones.filter((z) => z.city !== city) })),

      createOrder: (input) => {
        const id = `ord-${Date.now()}`;
        const order: Order = {
          id,
          code: orderCode(id),
          customer: input.customer,
          items: input.items,
          subtotal: input.subtotal,
          discount: input.discount,
          promoCode: input.promoCode,
          deliveryFee: input.deliveryFee,
          total: input.total,
          deliveryMode: input.deliveryMode,
          relaisPoint: input.relaisPoint,
          paymentMethod: input.paymentMethod,
          paymentStatus: "attente",
          status: "nouvelle",
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        // decrement stock
        for (const it of input.items) {
          get().updateProduct(
            it.productId,
            { stock: Math.max(0, (get().products.find((p) => p.id === it.productId)?.stock ?? 0) - it.qty) }
          );
        }
        return order;
      },

      setOrderPaymentStatus: (id, status, method) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const nextStatus: OrderStatus =
              status === "reussi" ? "payee" : status === "annule" ? "annulee" : o.status;
            return {
              ...o,
              paymentStatus: status,
              status: nextStatus,
              paymentMethod: method ?? o.paymentMethod,
            };
          }),
        })),

      setOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      findOrder: (codeOrPhone) => {
        const query = codeOrPhone.trim().toLowerCase();
        return get().orders.find(
          (o) =>
            o.code.toLowerCase() === query ||
            o.customer.phone.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
        );
      },
    }),
    { name: "achavite-shop-v2" }
  )
);

export { CATEGORIES };
