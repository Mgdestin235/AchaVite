import { Wallet } from "lucide-react";
import type { StorePaymentMethod } from "@/lib/db/types";

/**
 * Informational only -- checkout itself still goes through AchaVite's
 * centralized order flow (see src/lib/db/orders.ts). This just tells a
 * buyer which direct payment methods this particular vendor also accepts.
 */
export function StorePaymentMethodsList({
  storeName,
  methods,
}: {
  storeName: string | null;
  methods: StorePaymentMethod[];
}) {
  if (methods.length === 0) return null;

  return (
    <div className="mt-5 rounded-xl border border-gray-200 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">
        <Wallet size={16} className="text-orange" />
        Moyens de paiement acceptés{storeName ? ` par ${storeName}` : ""}
      </div>
      <ul className="space-y-1 text-sm text-gray-600">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <span>{m.label}</span>
            {m.number && <span className="font-mono text-xs text-gray-400">{m.number}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
