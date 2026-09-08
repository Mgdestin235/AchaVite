import type { PaymentProviderKey } from "@/lib/db/types";
import { ProviderNotConfiguredError, type PaymentProvider } from "../types";

/**
 * Shared shape for every not-yet-integrated gateway (Wave, Orange Money,
 * MTN MoMo, Moov Money, Airtel Money API integrations -- as opposed to
 * "manual", which pays through these same operators by hand today). Each
 * checks an env var placeholder so isConfigured() naturally flips to true
 * once real credentials are added, with zero call-site changes elsewhere.
 */
function createStubProvider(key: PaymentProviderKey, envVar: string): PaymentProvider {
  return {
    key,
    isConfigured: () => Boolean(process.env[envVar]),
    async initiate() {
      throw new ProviderNotConfiguredError(key);
    },
  };
}

export const waveProvider = createStubProvider("wave", "WAVE_API_KEY");
export const orangeMoneyProvider = createStubProvider("orange_money", "ORANGE_MONEY_API_KEY");
export const mtnMomoProvider = createStubProvider("mtn_momo", "MTN_MOMO_API_KEY");
export const moovMoneyProvider = createStubProvider("moov_money", "MOOV_MONEY_API_KEY");
export const airtelMoneyProvider = createStubProvider("airtel_money", "AIRTEL_MONEY_API_KEY");
