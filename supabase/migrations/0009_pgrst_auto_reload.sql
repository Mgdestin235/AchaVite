-- Root cause of the recurring "Could not find the '<col>' column of
-- '<table>' in the schema cache" errors: this project has no event
-- trigger telling PostgREST to refresh its schema cache after a DDL
-- change, so every single migration in this project has needed a manual
-- `NOTIFY pgrst, 'reload schema';` -- and any that was forgotten left the
-- REST API serving a stale view of the schema.
--
-- This installs the standard auto-reload event triggers (the same ones
-- Supabase ships by default but which are missing here), so from now on
-- ANY create/alter/drop automatically notifies PostgREST. Plus one
-- immediate reload to clear the current stale state.

create or replace function public.pgrst_reload_schema()
returns event_trigger
language plpgsql
as $$
begin
  notify pgrst, 'reload schema';
end;
$$;

drop event trigger if exists pgrst_reload_on_ddl_end;
create event trigger pgrst_reload_on_ddl_end
  on ddl_command_end
  execute function public.pgrst_reload_schema();

drop event trigger if exists pgrst_reload_on_sql_drop;
create event trigger pgrst_reload_on_sql_drop
  on sql_drop
  execute function public.pgrst_reload_schema();

-- Clear the cache that's stale right now (why "Valider la boutique"
-- currently fails on stores.rejection_reason even though the column has
-- existed since 0001).
notify pgrst, 'reload schema';
