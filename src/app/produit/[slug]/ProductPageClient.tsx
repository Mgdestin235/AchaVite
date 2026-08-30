"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Star, Zap, ChevronRight, Check, FileText, BookOpen, Download } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import { useCartStore } from "@/lib/store/cart";
import { useRecentStore } from "@/lib/store/recent";
import { CATEGORIES } from "@/lib/data";
import { formatFCFA, discountPercent } from "@/lib/format";
import { Gallery } from "@/components/product/Gallery";
import { ProductBadges } from "@/components/product/ProductBadges";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function ProductPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const products = useShopStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);
  const trackRecent = useRecentStore((s) => s.track);
  const recentIds = useRecentStore((s) => s.ids);

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) trackRecent(product.id);
  }, [product, trackRecent]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Produit introuvable"
          description="Ce produit n'existe pas ou n'est plus disponible."
          actionLabel="Retour au catalogue"
          actionHref="/catalogue"
        />
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.slug === product.category);
  const outOfStock = product.stock <= 0;
  const discount = discountPercent(product.price, product.oldPrice);

  const similar = products
    .filter((p) => p.category === product.category && p.id !== product.id && p.active)
    .slice(0, 5);

  const recentlyViewed = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.id !== product.id)
    .slice(0, 5);

  function handleAdd() {
    addItem(product!.id, qty);
    toast.success(`${product!.name} ajouté au panier`, {
      description: `Quantité : ${qty}`,
    });
  }

  function handleBuyNow() {
    addItem(product!.id, qty);
    router.push("/panier");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-gray-500">
        <Link href="/" className="hover:text-navy">Accueil</Link>
        <ChevronRight size={13} />
        {category && (
          <>
            <Link href={`/categorie/${category.slug}`} className="hover:text-navy">
              {category.name}
            </Link>
            <ChevronRight size={13} />
          </>
        )}
        <span className="truncate text-navy">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative">
            <Gallery images={product.images} alt={product.name} />
            <div className="pointer-events-none absolute left-0 top-0">
              <ProductBadges product={product} />
            </div>
          </div>
          {product.videoUrl && (
            <video
              src={product.videoUrl}
              controls
              className="mt-3 aspect-video w-full rounded-2xl bg-black"
            />
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star size={15} className="fill-orange text-orange" />
              {product.rating}
            </span>
            <span>({product.reviews} avis)</span>
            <span className="text-gray-300">•</span>
            <span>{product.sold} vendus</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-orange sm:text-3xl">
              {formatFCFA(product.price)}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {formatFCFA(product.oldPrice)}
                </span>
                <span className="rounded-md bg-orange-light px-2 py-0.5 text-xs font-bold text-orange-dark">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{product.description}</p>

          {product.highlights.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-navy">
                  <Check size={15} className="shrink-0 text-orange" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          {product.files.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {product.files.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy hover:border-orange hover:text-orange"
                >
                  {f.kind === "ebook" ? <BookOpen size={16} /> : <FileText size={16} />}
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <Download size={15} className="shrink-0" />
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 text-sm">
            {outOfStock ? (
              <span className="font-semibold text-red-500">Rupture de stock</span>
            ) : product.stock <= 5 ? (
              <span className="font-semibold text-orange">
                Plus que {product.stock} en stock
              </span>
            ) : (
              <span className="font-semibold text-green-600">En stock</span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-navy">Quantité</span>
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center text-navy hover:bg-gray-50"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
                className="flex h-9 w-9 items-center justify-center text-navy hover:bg-gray-50"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-navy px-4 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart size={18} />
              Ajouter au panier
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 transition-transform hover:bg-orange-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Zap size={18} className="fill-white" />
              Acheter maintenant
            </button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-navy">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-navy">Récemment consultés</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
