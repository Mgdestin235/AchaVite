import type { Product } from "./types";
import type { Filters } from "@/components/product/FilterSort";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function filterAndSortProducts(
  products: Product[],
  { query, filters }: { query?: string; filters: Filters }
): Product[] {
  let result = products.filter((p) => p.active);

  if (query && query.trim()) {
    const q = normalize(query.trim());
    result = result.filter((p) => normalize(p.name).includes(q));
  }

  if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.onlyPromo) {
    result = result.filter((p) => p.oldPrice && p.oldPrice > p.price);
  }
  if (filters.onlyStock) {
    result = result.filter((p) => p.stock > 0);
  }

  switch (filters.sort) {
    case "populaire":
      result = [...result].sort((a, b) => b.sold - a.sold);
      break;
    case "nouveaute":
      result = [...result].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      break;
    case "prix-asc":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "prix-desc":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }

  return result;
}
