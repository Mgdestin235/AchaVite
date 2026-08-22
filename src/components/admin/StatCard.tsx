import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "navy" | "orange" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    navy: "bg-navy/10 text-navy",
    orange: "bg-orange-light text-orange-dark",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
  };
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-xl font-extrabold text-navy">{value}</p>
    </div>
  );
}
