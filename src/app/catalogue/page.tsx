import type { SortKey } from "@/components/product/FilterSort";
import { CataloguePageClient } from "./CataloguePageClient";

export default async function CataloguePage(props: PageProps<"/catalogue">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const initialSort = (typeof searchParams.tri === "string" ? searchParams.tri : "pertinence") as SortKey;
  const initialCategory = typeof searchParams.categorie === "string" ? searchParams.categorie : "";

  return (
    <CataloguePageClient query={query} initialSort={initialSort} initialCategory={initialCategory} />
  );
}
