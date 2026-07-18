-- Harden the helper used by trust-gate RLS and cover the new audit foreign key.
alter function public.is_admin() set search_path = '';

create index if not exists product_offers_verified_by_idx
  on public.product_offers(verified_by);
