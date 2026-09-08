import type { PaymentProviderKey } from "@/lib/db/types";
import type { PaymentProvider } from "./types";
import { createManualProvider } from "./providers/manual";
import {
  waveProvider,
  orangeMoneyProvider,
  mtnMomoProvider,
  moovMoneyProvider,
  airtelMoneyProvider,
} from "./providers/stub";

/**
 * The single extension seam: adding a real gateway later means implementing
 * PaymentProvider in providers/<name>.ts and wiring it in here -- nothing
 * else in the app (pages, API routes, the confirm_subscription_payment RPC)
 * needs to change.
 */
export function getProvider(key: PaymentProviderKey, whatsappNumber: string | null): PaymentProvider {
  switch (key) {
    case "manual":
      return createManualProvider(whatsappNumber);
    case "wave":
      return waveProvider;
    case "orange_money":
      return orangeMoneyProvider;
    case "mtn_momo":
      return mtnMomoProvider;
    case "moov_money":
      return moovMoneyProvider;
    case "airtel_money":
      return airtelMoneyProvider;
  }
}
