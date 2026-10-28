-- Owner decision 2026-10-28: total service commission is 20% on NEW bookings.
-- Existing booking quotes, KTV payouts and MCN snapshots remain unchanged.
-- The MCN still receives 20% of the rounded commission (nominally 4% of service
-- price); the platform retains the other 80% (nominally 16%). Travel and urgency
-- fees remain entirely with the freelancer; customers pay no platform surcharge.
update public.fee_policy set commission_rate = 0.20, updated_at = now() where id;
alter table public.fee_policy alter column commission_rate set default 0.20;
