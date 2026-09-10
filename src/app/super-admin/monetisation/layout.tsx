"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/super-admin/monetisation/revenus", label: "Revenus" },
  { href: "/super-admin/monetisation/candidatures", label: "Candidatures vendeur" },
  { href: "/super-admin/monetisation/plans", label: "Plans" },
  { href: "/super-admin/monetisation/abonnements", label: "Abonnements" },
  { href: "/super-admin/monetisation/paiements", label: "Paiements" },
  { href: "/super-admin/monetisation/factures", label: "Factures" },
  { href: "/super-admin/monetisation/moyens-de-paiement", label: "Moyens de paiement" },
  { href: "/super-admin/monetisation/prestataires", label: "Prestataires" },
  { href: "/super-admin/monetisation/promotions", label: "Promotions" },
  { href: "/super-admin/monetisation/pays", label: "Pays" },
];

export default function MonetisationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-navy">Monétisation</h1>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              pathname === tab.href
                ? "border-orange text-orange"
                : "border-transparent text-gray-500 hover:text-navy"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
