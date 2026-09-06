"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { listOrdersForCustomer, type OrderSummary } from "@/lib/orderLookup";
import { resolveOverallStatus } from "@/lib/db/orders";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OrderStatus } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  nouvelle: "bg-navy/10 text-navy",
  confirmee: "bg-blue-100 text-blue-700",
  preparation: "bg-orange-light text-orange-dark",
  expediee: "bg-purple-100 text-purple-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-600",
};

type Tab = "toutes" | "en-cours" | "livrees";

export default function MyOrdersPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("toutes");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setUserId(user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    listOrdersForCustomer(supabase, userId).then((data) => {
      if (cancelled) return;
      setOrders(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const ordersWithStatus = orders.map((o) => ({
    ...o,
    overallStatus: resolveOverallStatus(o.order_items.map((it) => it.status)),
  }));

  const filtered = ordersWithStatus.filter((o) => {
    if (tab === "en-cours") return !["livree", "annulee"].includes(o.overallStatus);
    if (tab === "livrees") return o.overallStatus === "livree";
    return true;
  });

  if (userId === undefined) {
    return <p className="py-20 text-center text-sm text-gray-400">Chargement...</p>;
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center sm:px-6">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy/5 text-navy">
          <User size={28} />
        </span>
        <h1 className="text-lg font-bold text-navy">Vous n&apos;êtes pas connecté</h1>
        <p className="mt-2 text-sm text-gray-500">
          Connectez-vous pour retrouver vos commandes.
        </p>
        <Link
          href="/connexion?redirect=/compte/commandes"
          className="mt-5 block w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Se connecter
        </Link>
        <Link href="/suivi" className="mt-3 block text-sm font-semibold text-navy hover:text-orange">
          Ou suivre une commande sans compte
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-navy">Mes commandes</h1>

      <div className="mb-5 flex gap-2">
        {[
          { key: "toutes" as const, label: "Toutes" },
          { key: "en-cours" as const, label: "En cours" },
          { key: "livrees" as const, label: "Livrées" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-navy text-white" : "bg-navy/5 text-navy"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucune commande ici"
          description="Vos commandes apparaîtront ici une fois passées."
          actionLabel="Découvrir les produits"
          actionHref="/catalogue"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/suivi?code=${order.code}`}
              className="block rounded-xl bg-white p-4 ring-1 ring-black/5 hover:ring-orange/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">{order.code}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[order.overallStatus])}>
                  {STATUS_LABELS[order.overallStatus]}
                </span>
              </div>
              <div className="mb-2 flex -space-x-2">
                {order.order_items.slice(0, 4).map((it) => (
                  <div key={it.id} className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-100">
                    {it.image && <Image src={it.image} alt={it.name} fill className="object-cover" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <span className="font-semibold text-navy">{formatFCFA(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
