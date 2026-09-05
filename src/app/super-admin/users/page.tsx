"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole, UserStatus } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  vendor: "Vendeur",
  customer: "Client",
};

export default function SuperAdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setUsers((data as Profile[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function updateRole(user: Profile, role: UserRole) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rôle mis à jour");
    setRefreshKey((k) => k + 1);
  }

  async function toggleStatus(user: Profile) {
    const status: UserStatus = user.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("profiles").update({ status }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "suspended" ? "Compte suspendu" : "Compte réactivé");
    setRefreshKey((k) => k + 1);
  }

  const filtered = users.filter(
    (u) =>
      !query ||
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.phone?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Utilisateurs ({users.length})</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom ou téléphone..."
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{user.name || "Sans nom"}</p>
                <p className="truncate text-xs text-gray-400">{user.phone || "—"}</p>
              </div>
              <select
                value={user.role}
                onChange={(e) => updateRole(user, e.target.value as UserRole)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button
                onClick={() => toggleStatus(user)}
                className={cn(
                  "w-fit rounded-full px-3 py-1 text-xs font-semibold",
                  user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                )}
              >
                {user.status === "active" ? "Actif" : "Suspendu"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
