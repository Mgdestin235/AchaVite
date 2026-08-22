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

// Fixed reference instant so seed data is deterministic across server and
// client renders (Date.now() would differ slightly between SSR and
// hydration and could cause a hydration mismatch).
const REFERENCE_NOW = new Date("2026-08-21T09:00:00.000Z").getTime();

function seedOrders(): Order[] {
  const cities = ["N'Djamena", "Moundou", "Sarh", "Abéché"];
  const names = [
    "Fatimé Abakar",
    "Issa Moussa",
    "Amina Djimet",
    "Youssouf Adam",
    "Kaltouma Hassan",
    "Ahmat Seid",
    "Halimé Oumar",
    "Djibrine Ali",
  ];
  const statuses: OrderStatus[] = [
    "livree",
    "livree",
    "expediee",
    "preparation",
    "payee",
    "paiement_attente",
    "livree",
    "annulee",
  ];
  const methods: PaymentMethod[] = ["mtn", "orange", "wave", "carte"];

  return statuses.map((status, i) => {
    const p1 = PRODUCTS[(i * 5) % PRODUCTS.length];
    const p2 = PRODUCTS[(i * 5 + 3) % PRODUCTS.length];
    const qty1 = 1 + (i % 2);
    const items: OrderItem[] = [
      { productId: p1.id, name: p1.name, image: p1.images[0], price: p1.price, qty: qty1 },
    ];
    if (i % 3 !== 0) {
      items.push({ productId: p2.id, name: p2.name, image: p2.images[0], price: p2.price, qty: 1 });
    }
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const deliveryFee = 1000 + (i % 3) * 500;
    const daysAgo = 13 - i;
    const createdAt = new Date(REFERENCE_NOW - daysAgo * 86400000).toISOString();
    const id = `ord-seed-${i + 1}`;
    return {
      id,
      code: orderCode(id + i.toString().padStart(6, "0")),
      customer: {
        name: names[i % names.length],
        phone: `+235 66 0${i}0 00 0${i}`,
        city: cities[i % cities.length],
        address: `Quartier ${(i % 6) + 1}, Rue ${(i % 12) + 1}`,
      },
      items,
      subtotal,
      discount: 0,
      deliveryFee,
      total: subtotal + deliveryFee,
      deliveryMode: i % 3 === 0 ? "boutique" : i % 3 === 1 ? "domicile" : "relais",
      paymentMethod: methods[i % methods.length],
      paymentStatus: status === "annulee" ? "annule" : status === "paiement_attente" ? "attente" : "reussi",
      status,
      createdAt,
      estimatedDelivery: new Date(Date.parse(createdAt) + 3 * 86400000).toISOString(),
    } satisfies Order;
  });
}

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
      orders: seedOrders(),

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
    { name: "achavite-shop" }
  )
);

export { CATEGORIES };
