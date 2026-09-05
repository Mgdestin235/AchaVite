"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { cn } from "@/lib/cn";

export default function AdminStockPage() {
  const products = useShopStore((s) => s.products);
  const updateProduct = useShopStore((s) => s.updateProduct);
  const [onlyLow, setOnlyLow] = useState(false);

  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const list = useMemo(
    () => (onlyLow ? products.filter((p) => p.stock <= 5) : products),
    [products, onlyLow]
  );

  function adjust(id: string, delta: number, current: number) {
    updateProduct(id, { stock: Math.max(0, current + delta) });
  }

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

      <div className="space-y-2">
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy">{p.name}</p>
              {p.stock <= 5 && (
                <p className="text-xs font-semibold text-orange">Stock faible</p>
              )}
            </div>
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => adjust(p.id, -1, p.stock)}
                className="flex h-9 w-9 items-center justify-center text-navy hover:bg-gray-50"
              >
                <Minus size={15} />
              </button>
              <input
                value={p.stock}
                onChange={(e) => updateProduct(p.id, { stock: Math.max(0, Number(e.target.value) || 0) })}
                className="w-12 border-x border-gray-200 bg-transparent py-1.5 text-center text-sm font-semibold outline-none"
              />
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
    </div>
  );
}
