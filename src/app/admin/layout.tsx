"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BadgePercent,
  Truck,
  LogOut,
  Menu,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useAdminAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/stock", label: "Stock", icon: Package },
  { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
  { href: "/admin/livraison", label: "Livraison", icon: Truck },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const logout = useAdminAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="inline-flex rounded-lg bg-white px-2 py-1.5">
          <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-8 w-auto" />
        </span>
        <p className="text-[11px] text-white/50">Administration</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-orange text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} />
          Voir la boutique
        </Link>
        <button
          onClick={() => {
            logout();
            router.push("/admin");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function AdminLoginGate() {
  const login = useAdminAuthStore((s) => s.login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login(password)) {
      setError("Mot de passe incorrect.");
      return;
    }
    setError("");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-12 w-auto" />
          <p className="text-sm font-bold text-navy">Espace administrateur</p>
        </div>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Mot de passe administrateur"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        <button className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark">
          Se connecter
        </button>
        <p className="mt-3 text-center text-[11px] text-gray-400">
          Accès démo : achavite2026
        </p>
      </form>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAuthed = useAdminAuthStore((s) => s.isAuthed);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthed) {
    return <AdminLoginGate />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-navy">
            <Menu size={22} />
          </button>
          <span className="text-sm font-bold text-navy">Administration AchaVite</span>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
