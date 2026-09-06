"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Package, MapPin, Bell, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type CustomerProfile = { id: string; email: string; name: string | null; phone: string | null };

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [customer, setCustomer] = useState<CustomerProfile | null | undefined>(undefined);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        setCustomer(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCustomer({ id: user.id, email: user.email ?? "", name: profile?.name ?? null, phone: profile?.phone ?? null });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customer.id)
      .then(({ count }) => {
        if (!cancelled) setOrderCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  if (customer === undefined) {
    return <p className="py-20 text-center text-sm text-gray-400">Chargement...</p>;
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center sm:px-6">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy/5 text-navy">
          <User size={28} />
        </span>
        <h1 className="text-lg font-bold text-navy">Vous n&apos;êtes pas connecté</h1>
        <p className="mt-2 text-sm text-gray-500">
          Connectez-vous pour retrouver votre profil et vos commandes.
        </p>
        <Link
          href="/connexion"
          className="mt-5 block w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Se connecter
        </Link>
        <Link
          href="/suivi"
          className="mt-3 block text-sm font-semibold text-navy hover:text-orange"
        >
          Suivre une commande sans compte
        </Link>
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    router.push("/boutique");
    router.refresh();
  }

  const displayName = customer.name || customer.email;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-4 rounded-xl bg-navy p-5 text-white">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl font-bold">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-bold">{displayName}</p>
          <p className="text-sm text-white/70">{customer.phone || customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/compte/commandes" className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-black/5 hover:ring-orange/30">
          <Package className="text-orange" size={22} />
          <span className="text-xs font-semibold text-navy">Mes commandes</span>
        </Link>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-black/5 opacity-60">
          <MapPin className="text-navy" size={22} />
          <span className="text-xs font-semibold text-navy">Adresses</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-black/5 opacity-60">
          <Bell className="text-navy" size={22} />
          <span className="text-xs font-semibold text-navy">Notifications</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-black/5 hover:ring-red-200"
        >
          <LogOut className="text-red-500" size={22} />
          <span className="text-xs font-semibold text-navy">Déconnexion</span>
        </button>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="mb-1 text-sm font-bold text-navy">Résumé</h2>
        <p className="text-sm text-gray-500">
          {orderCount === null
            ? "Chargement..."
            : `Vous avez passé ${orderCount} commande${orderCount > 1 ? "s" : ""} sur AchaVite.`}
        </p>
      </div>
    </div>
  );
}
