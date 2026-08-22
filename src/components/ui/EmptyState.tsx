import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { PackageSearch } from "lucide-react";

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-navy/[0.03] px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/5 text-navy">
        <Icon size={30} strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
