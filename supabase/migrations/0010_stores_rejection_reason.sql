-- The stores.rejection_reason column (originally in 0002) turned out never
-- to have been applied to the live database -- validating/refusing a store
-- from /super-admin/stores/[id] failed with a schema error on it. 0002's
-- statement is idempotent; re-running it here fixes the live project.
alter table public.stores add column if not exists rejection_reason text;
