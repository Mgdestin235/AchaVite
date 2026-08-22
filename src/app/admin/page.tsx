"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";

const PIE_COLORS = ["#0B1F3A", "#FF7A1A", "#14315C", "#FFB27A", "#5B7CA8"];

export default function AdminDashboardPage() {
  const orders = useShopStore((s) => s.orders);
  const products = useShopStore((s) => s.products);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.status !== "annulee")
      .reduce((sum, o) => sum + o.total, 0);
    const today = new Date().toDateString();
    const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
    const pending = orders.filter((o) => o.status === "nouvelle" || o.status === "paiement_attente").length;
    const shipped = orders.filter((o) => o.status === "expediee").length;
    const delivered = orders.filter((o) => o.status === "livree").length;
    const available = products.filter((p) => p.active && p.stock > 0).length;
    const lowStock = products.filter((p) => p.active && p.stock > 0 && p.stock <= 5).length;
    return { revenue, ordersToday, pending, shipped, delivered, available, lowStock };
  }, [orders, products]);

  const salesByDay = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const total = orders
        .filter((o) => o.status !== "annulee" && new Date(o.createdAt).toDateString() === key)
        .reduce((s, o) => s + o.total, 0);
      days.push({ date: key, label, total });
    }
    return days;
  }, [orders]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p) => ({
      name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
      ventes: p.sold,
    })),
    [products]
  );

  const ordersByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.customer.city, (map.get(o.customer.city) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatFCFA(stats.revenue)} icon={Wallet} tone="orange" />
        <StatCard label="Commandes du jour" value={String(stats.ordersToday)} icon={ShoppingBag} tone="navy" />
        <StatCard label="En attente" value={String(stats.pending)} icon={Clock} tone="red" />
        <StatCard label="Expédiées" value={String(stats.shipped)} icon={Truck} tone="navy" />
        <StatCard label="Livrées" value={String(stats.delivered)} icon={CheckCircle2} tone="green" />
        <StatCard label="Produits disponibles" value={String(stats.available)} icon={Package} tone="navy" />
        <StatCard label="Stock presque épuisé" value={String(stats.lowStock)} icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 lg:col-span-2">
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

        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-bold text-navy">Commandes par ville</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={ordersByCity}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={(entry) => entry.name}
              >
                {ordersByCity.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-bold text-navy">Produits les plus vendus</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDF0F4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
              <Tooltip />
              <Bar dataKey="ventes" fill="#0B1F3A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
