export type Category = {
  slug: string;
  name: string;
  icon: string;
  image: string;
};

export type ProductFileKind = "pdf" | "ebook";

export type ProductFile = {
  id: string;
  name: string;
  url: string;
  kind: ProductFileKind;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  images: string[];
  videoUrl?: string;
  files: ProductFile[];
  description: string;
  highlights: string[];
  stock: number;
  rating: number;
  reviews: number;
  sold: number;
  isNew: boolean;
  isBestSeller: boolean;
  active: boolean;
  createdAt: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

export type DeliveryMode = "domicile" | "relais" | "boutique";

export type PaymentMethod = "mtn" | "airtel" | "moov" | "banque";

export type MobileMoneyConfig = {
  enabled: boolean;
  label: string;
  number: string;
};

export type BankTransferConfig = {
  enabled: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type ShopSettings = {
  whatsappNumber: string;
  paymentMethods: {
    mtn: MobileMoneyConfig;
    airtel: MobileMoneyConfig;
    moov: MobileMoneyConfig;
    banque: BankTransferConfig;
  };
};

export type PaymentStatus = "reussi" | "echoue" | "annule" | "attente";

export type OrderStatus =
  | "nouvelle"
  | "paiement_attente"
  | "payee"
  | "preparation"
  | "expediee"
  | "livree"
  | "annulee";

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  code: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
    neighborhood?: string;
    account?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  total: number;
  deliveryMode: DeliveryMode;
  relaisPoint?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  digitalDelivered?: boolean;
};

export type Promo = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  used: number;
  active: boolean;
};

export type DeliveryZone = {
  city: string;
  feeDomicile: number;
  feeRelais: number;
  hasRelais: boolean;
  hasBoutique: boolean;
  relaisPoints: string[];
};

export type Customer = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  city?: string;
  address?: string;
};
