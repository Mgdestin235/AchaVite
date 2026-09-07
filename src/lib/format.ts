export function formatFCFA(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

// 8 hex chars (32 bits) rather than 6 (24 bits): at 6, the birthday paradox
// gives a 50% chance of a code collision by ~4,800 orders -- too low for a
// growing marketplace. createOrder() also retries on a unique-constraint
// collision as a second line of defense.
export function orderCode(id: string): string {
  return `AV-${id.slice(-8).toUpperCase()}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
