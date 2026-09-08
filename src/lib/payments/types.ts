import type { PaymentProviderKey } from "@/lib/db/types";

export type InitiatePaymentInput = {
  storeName: string;
  amount: number;
  currencyCode: string;
  label: string; // e.g. "Essai AchaVite (3 mois)" or "Abonnement PRO -- Septembre 2026"
  reference: string; // e.g. the subscription_payments row id, used to match up a manual confirmation
};

export type InitiatePaymentResult = {
  /** True for the only real provider today (manual): the vendor still has to declare the payment themselves after paying. */
  requiresManualConfirmation: boolean;
  /** A link to open (WhatsApp deep link for `manual`; a real checkout URL once a gateway is wired in). */
  redirectUrl: string | null;
  instructions: string | null;
};

/**
 * The extension seam for adding a real payment gateway later: implement this
 * interface, add the concrete provider to src/lib/payments/registry.ts, and
 * flip `payment_providers.is_active` for it in the Super Admin panel --
 * nothing else in the app needs to change.
 */
export interface PaymentProvider {
  key: PaymentProviderKey;
  isConfigured(): boolean;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerKey: PaymentProviderKey) {
    super(`Le moyen de paiement "${providerKey}" n'est pas encore configuré. Intégration à venir.`);
    this.name = "ProviderNotConfiguredError";
  }
}
