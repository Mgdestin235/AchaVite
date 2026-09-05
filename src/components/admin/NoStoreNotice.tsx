import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";

export function NoStoreNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/5 text-navy">
        <StoreIcon size={26} />
      </span>
      <h1 className="text-lg font-bold text-navy">Créez d&apos;abord votre boutique</h1>
      <p className="max-w-sm text-sm text-gray-500">{message}</p>
      <Link
        href="/admin/store"
        className="mt-2 rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
      >
        Créer ma boutique
      </Link>
    </div>
  );
}
