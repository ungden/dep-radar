-- The owner reversed 20261001100000 the same day (2026-09-24): one commission
-- for every booking, no "khách tự mang về" rate, since two rates were more
-- confusing than they were worth. Nothing had been charged at the lower rate
-- and no customer had been claimed, so everything it added goes.

drop trigger if exists booking_own_client on public.bookings;
drop function if exists public.booking_own_client_rate();
drop function if exists public.admin_own_client_ranking();
drop function if exists public.my_own_client_stats();
drop function if exists public.claim_own_client(text, text);
drop function if exists public.log_pro_visit(text, text);
drop table if exists public.pro_link_visits;
drop table if exists public.pro_clients;
alter table public.bookings drop column if exists own_client;
alter table public.fee_policy
  drop constraint if exists fee_policy_own_client_rate,
  drop column if exists own_client_commission_rate;
