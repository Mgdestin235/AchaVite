import type { Category, DeliveryZone, Product, Promo } from "./types";
import { slugify } from "./format";

export const CATEGORIES: Category[] = [
  { slug: "telephones", name: "Téléphones", icon: "Smartphone", image: "https://picsum.photos/seed/cat-telephones/400/400" },
  { slug: "electronique", name: "Électronique", icon: "Headphones", image: "https://picsum.photos/seed/cat-electronique/400/400" },
  { slug: "mode", name: "Mode", icon: "Shirt", image: "https://picsum.photos/seed/cat-mode/400/400" },
  { slug: "beaute", name: "Beauté", icon: "Sparkles", image: "https://picsum.photos/seed/cat-beaute/400/400" },
  { slug: "maison", name: "Maison", icon: "Home", image: "https://picsum.photos/seed/cat-maison/400/400" },
  { slug: "accessoires", name: "Accessoires", icon: "Watch", image: "https://picsum.photos/seed/cat-accessoires/400/400" },
  { slug: "services", name: "Services", icon: "Wrench", image: "https://picsum.photos/seed/cat-services/400/400" },
  { slug: "offres", name: "Offres spéciales", icon: "Percent", image: "https://picsum.photos/seed/cat-offres/400/400" },
];

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  highlights: string[];
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  daysAgo: number;
};

const SEED: SeedProduct[] = [
  // Téléphones
  {
    name: "Smartphone Nova X12 128Go",
    category: "telephones",
    price: 89000,
    oldPrice: 115000,
    description:
      "Un smartphone puissant et élégant avec grand écran AMOLED, triple caméra et batterie longue durée. Idéal pour un usage quotidien intensif.",
    highlights: ["Écran AMOLED 6.5\"", "128 Go de stockage", "Batterie 5000 mAh", "Triple caméra 50MP"],
    stock: 24,
    isBestSeller: true,
    daysAgo: 4,
  },
  {
    name: "Smartphone Zeni A8 64Go",
    category: "telephones",
    price: 52000,
    oldPrice: 64000,
    description: "Smartphone fiable et abordable, parfait pour les réseaux sociaux, les appels et la navigation au quotidien.",
    highlights: ["Écran 6.1\"", "64 Go de stockage", "Double SIM", "Batterie 4500 mAh"],
    stock: 40,
    daysAgo: 2,
  },
  {
    name: "Smartphone Pulse Pro 256Go",
    category: "telephones",
    price: 145000,
    description: "Le haut de gamme AchaVite : performances premium, charge rapide et appareil photo professionnel.",
    highlights: ["Écran 6.7\" 120Hz", "256 Go de stockage", "Charge rapide 65W", "Caméra 108MP"],
    stock: 12,
    isNew: true,
    daysAgo: 1,
  },
  {
    name: "Smartphone Mini Air 32Go",
    category: "telephones",
    price: 38000,
    description: "Compact et léger, ce smartphone d'entrée de gamme couvre tous vos besoins essentiels à petit prix.",
    highlights: ["Écran 5.5\"", "32 Go de stockage", "Léger 150g", "Autonomie 2 jours"],
    stock: 55,
    daysAgo: 10,
  },
  {
    name: "Smartphone Vantage 12 5G",
    category: "telephones",
    price: 168000,
    oldPrice: 199000,
    description: "Profitez de la vitesse 5G avec un design premium tout écran et un processeur dernière génération.",
    highlights: ["Compatible 5G", "12 Go RAM", "Écran incurvé", "Charge sans fil"],
    stock: 8,
    isBestSeller: true,
    daysAgo: 6,
  },
  // Électronique
  {
    name: "Écouteurs sans fil AchaBuds",
    category: "electronique",
    price: 15000,
    oldPrice: 22000,
    description: "Son immersif, réduction de bruit active et autonomie de 24h avec boîtier de charge.",
    highlights: ["Réduction de bruit active", "Autonomie 24h", "Bluetooth 5.3", "Résistant à l'eau"],
    stock: 60,
    isBestSeller: true,
    daysAgo: 3,
  },
  {
    name: "Enceinte Bluetooth PowerSound",
    category: "electronique",
    price: 21000,
    description: "Enceinte portable puissante avec basses profondes, idéale pour vos soirées entre amis.",
    highlights: ["Puissance 20W", "Autonomie 12h", "Étanche IPX6", "Bluetooth 5.0"],
    stock: 34,
    daysAgo: 8,
  },
  {
    name: "Montre connectée FitTrack",
    category: "electronique",
    price: 27000,
    oldPrice: 35000,
    description: "Suivez votre activité, votre sommeil et vos notifications directement depuis votre poignet.",
    highlights: ["Écran tactile couleur", "Suivi cardiaque", "Étanche", "Autonomie 7 jours"],
    stock: 27,
    isNew: true,
    daysAgo: 1,
  },
  {
    name: "Télévision LED SmartView 43\"",
    category: "electronique",
    price: 175000,
    oldPrice: 210000,
    description: "Télévision Smart TV grand format avec image Full HD éclatante et accès à vos applications préférées.",
    highlights: ["43 pouces Full HD", "Smart TV", "3 ports HDMI", "Haut-parleurs intégrés"],
    stock: 9,
    daysAgo: 15,
  },
  // Mode
  {
    name: "Robe élégante Aïcha",
    category: "mode",
    price: 18500,
    description: "Robe fluide et raffinée, coupe moderne adaptée à toutes les occasions.",
    highlights: ["Tissu respirant", "Coupe ajustée", "Disponible plusieurs tailles"],
    stock: 30,
    isNew: true,
    daysAgo: 2,
  },
  {
    name: "Ensemble homme Prestige",
    category: "mode",
    price: 24000,
    oldPrice: 30000,
    description: "Ensemble deux pièces au style soigné, parfait pour un look professionnel et élégant.",
    highlights: ["Tissu premium", "Coupe moderne", "Facile à entretenir"],
    stock: 22,
    daysAgo: 9,
  },
  {
    name: "Baskets urbaines StreetFlex",
    category: "mode",
    price: 19500,
    oldPrice: 26000,
    description: "Baskets confortables au design urbain, semelle amortissante pour un confort toute la journée.",
    highlights: ["Semelle amortissante", "Matière respirante", "Style unisexe"],
    stock: 45,
    isBestSeller: true,
    daysAgo: 5,
  },
  {
    name: "Sandales cuir Confort+",
    category: "mode",
    price: 12500,
    description: "Sandales en cuir véritable, alliant confort et élégance pour toutes vos sorties.",
    highlights: ["Cuir véritable", "Semelle souple", "Résistantes"],
    stock: 38,
    daysAgo: 12,
  },
  {
    name: "Chemise classique Élégance",
    category: "mode",
    price: 11000,
    description: "Chemise en coton doux, coupe droite, indispensable de votre garde-robe.",
    highlights: ["100% coton", "Coupe droite", "Facile d'entretien"],
    stock: 50,
    daysAgo: 7,
  },
  // Beauté
  {
    name: "Coffret soins visage Éclat",
    category: "beaute",
    price: 14500,
    oldPrice: 19000,
    description: "Routine complète pour une peau nette et éclatante : nettoyant, sérum et crème hydratante.",
    highlights: ["3 produits inclus", "Peaux sensibles", "Sans paraben"],
    stock: 26,
    isBestSeller: true,
    daysAgo: 4,
  },
  {
    name: "Parfum Signature Homme",
    category: "beaute",
    price: 22000,
    description: "Fragrance boisée et intense qui affirme votre présence toute la journée.",
    highlights: ["Longue tenue", "Flacon 100ml", "Notes boisées"],
    stock: 18,
    daysAgo: 11,
  },
  {
    name: "Huile capillaire nourrissante",
    category: "beaute",
    price: 8500,
    description: "Huile naturelle pour nourrir, réparer et faire briller vos cheveux.",
    highlights: ["Ingrédients naturels", "Convient à tous cheveux", "Format 200ml"],
    stock: 42,
    isNew: true,
    daysAgo: 1,
  },
  {
    name: "Palette maquillage Glow",
    category: "beaute",
    price: 13000,
    oldPrice: 17500,
    description: "Palette de fards à paupières aux teintes intenses et pigmentées pour tous les looks.",
    highlights: ["12 teintes", "Haute pigmentation", "Longue tenue"],
    stock: 33,
    daysAgo: 6,
  },
  // Maison
  {
    name: "Ensemble ustensiles cuisine Pro",
    category: "maison",
    price: 27500,
    description: "Set complet d'ustensiles de cuisine robustes pour équiper votre cuisine efficacement.",
    highlights: ["12 pièces", "Résistant à la chaleur", "Facile à nettoyer"],
    stock: 20,
    daysAgo: 13,
  },
  {
    name: "Lampe LED design Ambiance",
    category: "maison",
    price: 9500,
    oldPrice: 13000,
    description: "Lampe moderne à intensité réglable pour une ambiance chaleureuse dans votre salon.",
    highlights: ["Intensité réglable", "Design moderne", "Faible consommation"],
    stock: 36,
    daysAgo: 5,
  },
  {
    name: "Parure de lit Cocon 4 pièces",
    category: "maison",
    price: 21500,
    description: "Parure douce et confortable pour des nuits paisibles, disponible en plusieurs coloris.",
    highlights: ["Tissu doux", "4 pièces incluses", "Plusieurs coloris"],
    stock: 25,
    isNew: true,
    daysAgo: 2,
  },
  {
    name: "Mixeur multifonction Chef",
    category: "maison",
    price: 32000,
    oldPrice: 39000,
    description: "Mixeur puissant multifonction pour préparer smoothies, sauces et pâtes facilement.",
    highlights: ["Puissance 600W", "Bol 1.5L", "Plusieurs vitesses"],
    stock: 15,
    isBestSeller: true,
    daysAgo: 8,
  },
  // Accessoires
  {
    name: "Sac à main Citadine",
    category: "accessoires",
    price: 16500,
    description: "Sac à main élégant et spacieux, idéal pour un usage quotidien.",
    highlights: ["Grand compartiment", "Bandoulière ajustable", "Simili-cuir résistant"],
    stock: 29,
    daysAgo: 9,
  },
  {
    name: "Lunettes de soleil UrbanShade",
    category: "accessoires",
    price: 9000,
    oldPrice: 12500,
    description: "Lunettes de soleil au design tendance avec protection UV400.",
    highlights: ["Protection UV400", "Monture légère", "Style unisexe"],
    stock: 41,
    daysAgo: 3,
  },
  {
    name: "Ceinture cuir ClassicFit",
    category: "accessoires",
    price: 7500,
    description: "Ceinture en cuir véritable, boucle métallique robuste, pour un style soigné.",
    highlights: ["Cuir véritable", "Boucle métal", "Ajustable"],
    stock: 47,
    daysAgo: 14,
  },
  {
    name: "Powerbank 20000mAh RapidCharge",
    category: "accessoires",
    price: 13500,
    oldPrice: 17000,
    description: "Batterie externe grande capacité avec charge rapide pour ne jamais tomber en panne.",
    highlights: ["20000 mAh", "Charge rapide", "2 ports USB"],
    stock: 39,
    isBestSeller: true,
    daysAgo: 4,
  },
  // Services
  {
    name: "Installation & configuration à domicile",
    category: "services",
    price: 5000,
    description: "Un technicien AchaVite installe et configure votre appareil chez vous en toute simplicité.",
    highlights: ["Intervention rapide", "Technicien certifié", "Disponible à N'Djamena"],
    stock: 999,
    daysAgo: 20,
  },
  {
    name: "Extension de garantie 12 mois",
    category: "services",
    price: 8000,
    description: "Prolongez la garantie de votre appareil AchaVite pour une tranquillité totale.",
    highlights: ["Couverture 12 mois", "Sans conditions cachées", "Valable sur tout achat éligible"],
    stock: 999,
    isNew: true,
    daysAgo: 1,
  },
];

// Fixed reference instant so createdAt is deterministic across server and
// client renders (using Date.now() here would tie-break same-day products
// differently on each render and cause a hydration mismatch).
const REFERENCE_NOW = new Date("2026-08-21T09:00:00.000Z").getTime();

function buildProducts(): Product[] {
  return SEED.map((s, i) => {
    const slug = slugify(s.name);
    const id = `p${(i + 1).toString().padStart(3, "0")}`;
    const images = [0, 1, 2].map(
      (n) => `https://picsum.photos/seed/${slug}-${n}/900/900`
    );
    const createdAt = new Date(REFERENCE_NOW - s.daysAgo * 86400000 - i * 60000).toISOString();
    return {
      id,
      slug,
      name: s.name,
      category: s.category,
      price: s.price,
      oldPrice: s.oldPrice,
      images,
      description: s.description,
      highlights: s.highlights,
      stock: s.stock,
      rating: Math.round((4 + ((i * 37) % 10) / 10) * 10) / 10,
      reviews: 8 + ((i * 53) % 240),
      sold: 20 + ((i * 91) % 500),
      isNew: !!s.isNew,
      isBestSeller: !!s.isBestSeller,
      active: true,
      createdAt,
    };
  });
}

export const PRODUCTS: Product[] = buildProducts();

export const PROMOS: Promo[] = [
  {
    code: "BIENVENUE10",
    type: "percent",
    value: 10,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    maxUses: 1000,
    used: 214,
    active: true,
  },
  {
    code: "ACHAVITE2000",
    type: "fixed",
    value: 2000,
    startDate: "2026-06-01",
    endDate: "2026-09-30",
    maxUses: 500,
    used: 87,
    active: true,
  },
];

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    city: "N'Djamena",
    feeDomicile: 1500,
    feeRelais: 800,
    hasRelais: true,
    hasBoutique: true,
    relaisPoints: ["Point relais Dembé", "Point relais Diguel", "Point relais Farcha"],
  },
  {
    city: "Moundou",
    feeDomicile: 2500,
    feeRelais: 1500,
    hasRelais: true,
    hasBoutique: false,
    relaisPoints: ["Point relais Moundou Centre"],
  },
  {
    city: "Sarh",
    feeDomicile: 2500,
    feeRelais: 1500,
    hasRelais: true,
    hasBoutique: false,
    relaisPoints: ["Point relais Sarh Centre"],
  },
  {
    city: "Abéché",
    feeDomicile: 3000,
    feeRelais: 0,
    hasRelais: false,
    hasBoutique: false,
    relaisPoints: [],
  },
];
