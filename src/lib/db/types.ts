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
  status: StoreStatus;
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
