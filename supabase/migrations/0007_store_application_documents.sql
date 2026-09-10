-- Supporting documents a vendor attaches to their store application
-- (ID, business registration, tax number, etc.). The Super Admin reviews
-- them on the store's dossier page before approving the store.
--
-- Files themselves live on Cloudinary (same as logos/banners) -- this table
-- just holds the label + URL. No sensitive card/bank data is ever stored.

create table if not exists public.store_documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  label text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists store_documents_store_idx on public.store_documents(store_id);

alter table public.store_documents enable row level security;

-- The owning vendor manages their own store's documents; the Super Admin
-- can read every store's documents (needed for the review). No public read
-- -- these are private application papers, not storefront content.
drop policy if exists "store_documents_select" on public.store_documents;
create policy "store_documents_select" on public.store_documents for select
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

drop policy if exists "store_documents_write" on public.store_documents;
create policy "store_documents_write" on public.store_documents for all
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  )
  with check (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
