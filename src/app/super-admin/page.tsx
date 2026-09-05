import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/admin/StatCard";
import { formatFCFA } from "@/lib/format";
import { Store, Users, Package, ShoppingBag, Clock, Wallet } from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: storeCount },
    { count: pendingStoreCount },
    { count: vendorCount },
    { count: customerCount },
    { count: productCount },
    { data: orders },
    { data: settings },
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total, status"),
    supabase.from("platform_settings").select("commission_percent").eq("id", 1).maybeSingle(),
  ]);

  const revenue = (orders ?? [])
    .filter((o) => o.status !== "annulee")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const commissionPercent = settings?.commission_percent ?? 10;
  const commissionEarned = (revenue * commissionPercent) / 100;
  const ordersCount = orders?.length ?? 0;

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Tableau de bord global</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Boutiques" value={String(storeCount ?? 0)} icon={Store} tone="navy" />
        <StatCard label="En attente de validation" value={String(pendingStoreCount ?? 0)} icon={Clock} tone="red" />
        <StatCard label="Vendeurs" value={String(vendorCount ?? 0)} icon={Users} tone="navy" />
        <StatCard label="Clients" value={String(customerCount ?? 0)} icon={Users} tone="navy" />
        <StatCard label="Produits" value={String(productCount ?? 0)} icon={Package} tone="navy" />
        <StatCard label="Commandes" value={String(ordersCount)} icon={ShoppingBag} tone="navy" />
        <StatCard label="Chiffre d'affaires plateforme" value={formatFCFA(revenue)} icon={Wallet} tone="orange" />
        <StatCard
          label={`Commissions (${commissionPercent}%)`}
          value={formatFCFA(commissionEarned)}
          icon={Wallet}
          tone="orange"
        />
      </div>
    </div>
  );
}
