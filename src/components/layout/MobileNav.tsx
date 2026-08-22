"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/catalogue", label: "Catégories", icon: LayoutGrid },
  { href: "/panier", label: "Panier", icon: ShoppingCart },
  { href: "/compte/commandes", label: "Commandes", icon: Package },
  { href: "/compte", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-100 bg-white/95 backdrop-blur lg:hidden">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              active ? "text-orange" : "text-gray-500"
            )}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
              {item.href === "/panier" && cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
