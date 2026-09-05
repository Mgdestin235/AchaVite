"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Wallet, ShoppingBag, Clock, Truck, CheckCircle2, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";
import type { OrderItemRow, OrderStatus, ProductRow } from "@/lib/db/types";

type ItemWithOrder = OrderItemRow & {
  orders: { status: OrderStatus; created_at: string } | null;
};

export function VendorDashboard({ storeId, storeName }: { storeId: string; storeName: string }) {
  const supabase = createClient();
  const [items, setItems] = useState<ItemWithOrder[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [itemsRes, productsRes] = await Promise.all([
        supabase
          .from("order_items")
          .select("*, orders(status, created_at)")
          .eq("store_id", storeId),
        supabase.from("products").select("*").eq("store_id", storeId),
      ]);
      if (cancelled) return;
      setItems((itemsRes.data as ItemWithOrder[]) ?? []);
      setProducts((productsRes.data as ProductRow[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, supabase]);

  const stats = useMemo(() => {
    const active = items.filter((it) => it.orders && it.orders.status !== "annulee");
    const revenue = active.reduce((sum, it) => sum + it.subtotal, 0);
    const today = new Date().toDateString();
    const ordersToday = items.filter(
      (it) => it.orders && new Date(it.orders.created_at).toDateString() === today
    ).length;
    const pending = items.filter((it) => it.orders?.status === "nouvelle" || it.orders?.status === "confirmee").length;
    const shipped = items.filter((it) => it.orders?.status === "expediee").length;
    const delivered = items.filter((it) => it.orders?.status === "livree").length;
    const available = products.filter((p) => p.status === "active" && p.stock > 0).length;
    return { revenue, ordersToday, pending, shipped, delivered, available };
  }, [items, products]);

  const salesByDay = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const total = items
        .filter((it) => it.orders?.status !== "annulee" && it.orders && new Date(it.orders.created_at).toDateString() === key)
        .reduce((sum, it) => sum + it.subtotal, 0);
      days.push({ label, total });
    }
    return days;
  }, [items]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy">Tableau de bord</h1>
      <p className="mb-5 text-sm text-gray-500">{storeName}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Chiffre d'affaires" value={formatFCFA(stats.revenue)} icon={Wallet} tone="orange" />
        <StatCard label="Commandes du jour" value={String(stats.ordersToday)} icon={ShoppingBag} tone="navy" />
        <StatCard label="En attente" value={String(stats.pending)} icon={Clock} tone="red" />
        <StatCard label="Expédiées" value={String(stats.shipped)} icon={Truck} tone="navy" />
        <StatCard label="Livrées" value={String(stats.delivered)} icon={CheckCircle2} tone="green" />
        <StatCard label="Produits en ligne" value={String(stats.available)} icon={Package} tone="navy" />
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-black/5">
        <h2 className="mb-4 text-sm font-bold text-navy">Ventes des 14 derniers jours</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salesByDay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF0F4" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v) => formatFCFA(Number(v))} />
            <Bar dataKey="total" fill="#FF7A1A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
