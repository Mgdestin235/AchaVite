"use client";

import { motion } from "framer-motion";
import { Check, Package, CreditCard, Truck, Home } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STEPS = [
  { key: "nouvelle", label: "Commande reçue", icon: Package },
  { key: "payee", label: "Paiement confirmé", icon: CreditCard },
  { key: "preparation", label: "Commande préparée", icon: Package },
  { key: "expediee", label: "Commande expédiée", icon: Truck },
  { key: "livree", label: "Commande livrée", icon: Home },
] as const;

function stepIndex(status: OrderStatus): number {
  switch (status) {
    case "nouvelle":
    case "paiement_attente":
      return 0;
    case "payee":
      return 1;
    case "preparation":
      return 2;
    case "expediee":
      return 3;
    case "livree":
      return 4;
    case "annulee":
      return -1;
  }
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const current = stepIndex(status);

  if (status === "annulee") {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-500">
        Cette commande a été annulée.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{
                  backgroundColor: done ? "#FF7A1A" : "#EDF0F4",
                  color: done ? "#FFFFFF" : "#9AA3AF",
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                {done ? <Check size={16} /> : <step.icon size={16} />}
              </motion.span>
              {!isLast && (
                <span
                  className={cn(
                    "w-0.5 flex-1 min-h-[28px]",
                    i < current ? "bg-orange" : "bg-gray-200"
                  )}
                />
              )}
            </div>
            <div className="pb-7">
              <p className={cn("text-sm font-semibold", done ? "text-navy" : "text-gray-400")}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
