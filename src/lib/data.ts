import type { Category } from "./types";

// Static display metadata (name/icon) for the platform-wide categories —
// slugs are kept in sync by hand with the `categories` seed rows in
// supabase/migrations/0001_marketplace_schema.sql so this can stay a plain
// client-side constant instead of a fetch. "offres" has no matching
// category row and is filtered out of the FilterSort dropdown; it's kept
// only so this array doesn't need reshuffling if it's ever wired up.
export const CATEGORIES: Category[] = [
  { slug: "telephones", name: "Téléphones", icon: "Smartphone", image: "" },
  { slug: "electronique", name: "Électronique", icon: "Headphones", image: "" },
  { slug: "mode", name: "Mode", icon: "Shirt", image: "" },
  { slug: "beaute", name: "Beauté", icon: "Sparkles", image: "" },
  { slug: "maison", name: "Maison", icon: "Home", image: "" },
  { slug: "accessoires", name: "Accessoires", icon: "Watch", image: "" },
  { slug: "services", name: "Services", icon: "Wrench", image: "" },
  { slug: "offres", name: "Offres spéciales", icon: "Percent", image: "" },
];
