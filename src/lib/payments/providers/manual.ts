import { buildSubscriptionWhatsAppLink } from "@/lib/whatsapp";
import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "../types";

/**
 * The one real implementation today: no gateway account exists yet, so the
 * vendor pays via whichever platform_payment_methods row they're shown
 * (Wave link/number, Orange Money number, ...) and then declares the
 * payment through a WhatsApp message, exactly like the existing
 * customer-order confirmation flow. A Super Admin later confirms it via
 * confirm_subscription_payment().
 */
export function createManualProvider(whatsappNumber: string | null): PaymentProvider {
  return {
    key: "manual",
    isConfigured: () => true,
    async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
      const redirectUrl = buildSubscriptionWhatsAppLink(
        {
          storeName: input.storeName,
          label: input.label,
          amount: input.amount,
          currencySymbol: input.currencyCode,
          reference: input.reference,
        },
        whatsappNumber
      );
      return {
        requiresManualConfirmation: true,
        redirectUrl,
        instructions:
          "Effectuez le paiement via un des moyens affichés, puis confirmez sur WhatsApp. Votre abonnement sera activé après validation par l'équipe AchaVite.",
      };
    },
  };
}
