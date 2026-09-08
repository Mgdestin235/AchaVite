import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogRow } from "./types";

/**
 * Server-only: audit_logs has no client insert policy at all (see
 * 0004_monetization.sql), so this must be called with createAdminClient()
 * from a Route Handler, never from the browser.
 */
export async function logAudit(
  adminSupabase: SupabaseClient,
  entry: { actorId: string | null; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await adminSupabase.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });
}

/** Super Admin only (enforced by RLS). */
export async function listAuditLogs(supabase: SupabaseClient, limit = 100): Promise<AuditLogRow[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AuditLogRow[]) ?? [];
}
