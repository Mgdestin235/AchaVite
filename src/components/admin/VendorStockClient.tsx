"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { listVendorProducts, updateProductStock, type ProductWithRelations } from "@/lib/db/products";
import { cn } from "@/lib/cn";

function StockInput({ stock, onCommit }: { stock: number; onCommit: (value: number) => void }) {
  // Local, uncommitted text so clearing the field to retype a number
  // doesn't briefly save 0 to the database on every keystroke. The parent
  // remounts this (via a key including `stock`) whenever the true value
  // changes externally, instead of syncing it back in with an effect.
  const [text, setText] = useState(String(stock));
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(Math.max(0, Number(text) || 0))}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      inputMode="numeric"
      className="w-12 border-x border-gray-200 bg-transparent py-1.5 text-center text-sm font-semibold outline-none"
    />
  );
}

export function VendorStockClient({ storeId }: { storeId: string }) {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlyLow, setOnlyLow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listVendorProducts(supabase, storeId).then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, refreshKey]);

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const list = useMemo(() => (onlyLow ? products.filter((p) => p.stock <= 5) : products), [products, onlyLow]);

  async function setStock(id: string, stock: number) {
    // Optimistic update so the input feels immediate.
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, stock) } : p)));
    const { error } = await updateProductStock(supabase, id, stock);
    if (error) {
      toast.error(error);
      setRefreshKey((k) => k + 1);
    }
  }

  function adjust(id: string, delta: number, current: number) {
    setStock(id, Math.max(0, current + delta));
  }

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-navy">Gestion du stock</h1>
        <button
          onClick={() => setOnlyLow((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            onlyLow ? "bg-orange text-white" : "bg-white text-navy ring-1 ring-black/5"
          )}
        >
          <AlertTriangle size={16} />
          Stock faible ({lowStockCount})
        </button>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucun produit pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {p.product_images[0] && (
                  <Image src={p.product_images[0].url} alt={p.name} fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy">{p.name}</p>
                {p.stock <= 5 && <p className="text-xs font-semibold text-orange">Stock faible</p>}
              </div>
              <div className="flex items-center rounded-lg border border-gray-200">
                <button
                  onClick={() => adjust(p.id, -1, p.stock)}
                  className="flex h-9 w-9 items-center justify-center text-navy hover:bg-gray-50"
                >
                  <Minus size={15} />
                </button>
                <StockInput key={`${p.id}-${p.stock}`} stock={p.stock} onCommit={(value) => setStock(p.id, value)} />
                <button
                  onClick={() => adjust(p.id, 1, p.stock)}
                  className="flex h-9 w-9 items-center justify-center text-navy hover:bg-gray-50"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
