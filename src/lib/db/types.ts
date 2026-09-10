// Mirrors the Postgres schema in supabase/migrations/0001_marketplace_schema.sql

export type UserRole = "super_admin" | "vendor" | "customer";
export type UserStatus = "active" | "suspended";
export type StoreStatus = "pending" | "approved" | "rejected" | "suspended";
export type ProductStatus = "active" | "inactive" | "pending";
export type OrderStatus = "nouvelle" | "confirmee" | "preparation" | "expediee" | "livree" | "annulee";
export type PaymentStatus = "attente" | "reussi" | "echoue" | "annule";
export type DeliveryMode = "domicile" | "relais" | "boutique";

export type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  city: string | null;
  category_id: string | null;
  opening_hours: string | null;
  delivery_info: string | null;
  country_code: string | null;
  status: StoreStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  highlights: string[];
  price: number;
  old_price: number | null;
  stock: number;
  video_url: string | null;
  status: ProductStatus;
  is_new: boolean;
  is_best_seller: boolean;
  rating: number;
  reviews_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  position: number;
};

export type ProductFileRow = {
  id: string;
  product_id: string;
  name: string;
  url: string;
  kind: "pdf" | "ebook";
};

export type DeliveryZoneRow = {
  id: string;
  store_id: string;
  city: string;
  fee_domicile: number;
  fee_relais: number;
  has_relais: boolean;
  has_boutique: boolean;
  relais_points: string[];
};

export type PromoRow = {
  id: string;
  store_id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  start_date: string;
  end_date: string;
  max_uses: number;
  used: number;
  active: boolean;
};

export type OrderRow = {
  id: string;
  code: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_city: string | null;
  customer_address: string | null;
  customer_neighborhood: string | null;
  subtotal: number;
  discount: number;
  promo_code: string | null;
  delivery_fee: number;
  total: number;
  delivery_mode: DeliveryMode;
  relais_point: string | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  status: OrderStatus;
  digital_delivered: boolean;
  created_at: string;
  estimated_delivery: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  commission_amount: number;
  vendor_payout: number;
  status: OrderStatus;
};

export type ReviewRow = {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type PlatformSettings = {
  id: 1;
  commission_percent: number;
  whatsapp_number: string | null;
  mtn_enabled: boolean;
  mtn_number: string | null;
  airtel_enabled: boolean;
  airtel_number: string | null;
  moov_enabled: boolean;
  moov_number: string | null;
  bank_enabled: boolean;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
};

// Mirrors supabase/migrations/0004_monetization.sql -- vendor trial/PRO
// subscriptions billed to the platform. Kept entirely separate from the
// customer-order money flow above (orders/order_items/payments/platform_settings).

export type PaymentProviderKey =
  | "manual"
  | "wave"
  | "orange_money"
  | "mtn_momo"
  | "moov_money"
  | "airtel_money"
  | "free_money"
  | "tmoney"
  | "flooz"
  | "bank_transfer"
  | "card"
  | "qr";

export type SubscriptionStatus =
  | "trial_pending"
  | "trial_active"
  | "trial_expired"
  | "pro_active"
  | "pro_expired"
  | "payment_pending"
  | "payment_failed"
  | "suspended"
  | "cancelled";

export type SubscriptionPaymentKind = "trial" | "pro_subscription" | "renewal" | "refund";
export type SubscriptionPaymentStatus = "pending" | "success" | "failed" | "refunded";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Country = {
  code: string;
  name: string;
  currency_code: string;
  phone_prefix: string;
  is_active: boolean;
};

export type PaymentProviderRow = {
  provider_key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;
  is_configured: boolean;
  country_codes: string[];
  notes: string | null;
};

export type PlatformPaymentMethod = {
  id: string;
  country_code: string | null;
  provider_key: PaymentProviderKey;
  label: string;
  number: string | null;
  payment_link: string | null;
  beneficiary_name: string | null;
  currency_code: string;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  price: number;
  currency_code: string;
  duration_days: number;
  features: string[];
  is_active: boolean;
  effective_from: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPromotion = {
  id: string;
  code: string;
  plan_id: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  starts_at: string;
  ends_at: string;
  max_uses: number;
  used: number;
  active: boolean;
};

export type Subscription = {
  id: string;
  store_id: string;
  plan_id: string | null;
  status: SubscriptionStatus;
  trial_activated_at: string | null;
  trial_expires_at: string | null;
  pro_activated_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_reminder_sent_days: number | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPayment = {
  id: string;
  store_id: string;
  subscription_id: string | null;
  plan_id: string;
  kind: SubscriptionPaymentKind;
  amount: number;
  currency_code: string;
  provider_key: PaymentProviderKey;
  status: SubscriptionPaymentStatus;
  period_start: string | null;
  period_end: string | null;
  reference: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  subscription_payment_id: string;
  store_id: string;
  amount: number;
  currency_code: string;
  period_start: string | null;
  period_end: string | null;
  status: SubscriptionPaymentStatus;
  pdf_url: string | null;
  created_at: string;
};

/** Mirrors migration 0007 -- vendor application papers reviewed by the Super Admin. */
export type StoreDocument = {
  id: string;
  store_id: string;
  label: string;
  file_url: string;
  created_at: string;
};

export type StorePaymentMethod = {
  id: string;
  store_id: string;
  provider_key: PaymentProviderKey;
  label: string;
  number: string | null;
  account_name: string | null;
  merchant_id: string | null;
  instructions: string | null;
  is_active: boolean;
  is_default: boolean;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Mirrors migration 0006 -- inert until the direct-to-seller checkout phase ships. */
export type OrderPaymentMode = "platform" | "direct_to_seller";

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
