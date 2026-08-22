import { SuiviPageClient } from "./SuiviPageClient";

export default async function SuiviPage(props: PageProps<"/suivi">) {
  const searchParams = await props.searchParams;
  const code = typeof searchParams.code === "string" ? searchParams.code : "";
  return <SuiviPageClient initialCode={code} />;
}
