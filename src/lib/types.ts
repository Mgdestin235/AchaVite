export type Category = {
  slug: string;
  name: string;
  icon: string;
  image: string;
};

export type ProductFileKind = "pdf" | "ebook";

export type ProductFile = {
  id: string;
  name: string;
  url: string;
  kind: ProductFileKind;
};

// Storefront display shape — populated from Postgres via
// `toLegacyProduct()` in src/lib/db/products.ts. Kept separate from the
// `ProductRow`/`ProductWithRelations` DB shape (src/lib/db/types.ts) so the
// product-display components (ProductCard, ProductBadges, FilterSort's
// filterAndSortProducts, ...) don't need to know about stores, categories
// as foreign keys, or any other marketplace plumbing.
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  images: string[];
  videoUrl?: string;
  files: ProductFile[];
  description: string;
  highlights: string[];
  stock: number;
  rating: number;
  reviews: number;
  sold: number;
  isNew: boolean;
  isBestSeller: boolean;
  active: boolean;
  createdAt: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

// Local, client-only "account" for guest shoppers (src/lib/store/auth.ts) —
// unrelated to the real Supabase-backed auth used by vendors/super admin.
export type Customer = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  city?: string;
  address?: string;
};
