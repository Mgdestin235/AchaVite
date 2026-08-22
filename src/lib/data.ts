import type { Category, DeliveryZone, Product, Promo } from "./types";

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

// Start empty: no demo products, promo codes, or delivery zones.
// Add real ones from the admin dashboard (/admin).
export const PRODUCTS: Product[] = [];

export const PROMOS: Promo[] = [];

export const DELIVERY_ZONES: DeliveryZone[] = [];
