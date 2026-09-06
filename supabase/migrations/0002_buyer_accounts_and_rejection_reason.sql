-- Adds what's needed for: real (Supabase-auth-backed) buyer accounts, and
-- a rejection reason shown to a vendor whose store application is refused.
-- Run this once against the live project (0001 already ran there).

alter table public.stores add column if not exists rejection_reason text;

-- Buyers now always have a real profile (role = 'customer', created by the
-- existing handle_new_user() trigger on signup), so orders should be
-- attributable to them. No schema change needed for that -- orders.customer_id
-- already references public.profiles(id) and is nullable only for the
-- pre-existing guest-tracking routes (/api/orders/lookup, /api/orders/by-phone),
-- which keep working for anyone who still has an old guest order.
