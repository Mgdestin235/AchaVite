"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/super-admin");
  // The landing page ("/") is its own full-screen acheteur/vendeur chooser
  // with its own minimal nav — the storefront chrome would be redundant.
  const isLanding = pathname === "/";

  if (isAdmin || isLanding) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
