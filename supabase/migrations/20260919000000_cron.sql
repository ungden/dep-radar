-- The maintenance functions exist, but nothing was calling them: a booking the
-- freelancer never answered sat there forever, holding a slot, while /chinh-sach
-- told the customer it would be released after two hours.
--
-- pg_cron ships with Supabase but not with every local image, so this is written
-- to skip cleanly where it is unavailable rather than break `supabase db reset`.

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;

  create extension if not exists pg_cron;

  -- Re-running a migration must not stack duplicate schedules.
  perform cron.unschedule(jobname)
  from cron.job
  where jobname in (
    'dep360-expire-bookings',
    'dep360-expire-jobs',
    'dep360-reminders',
    'dep360-metrics',
    'dep360-wallet'
  );

  -- Every five minutes: release the slot of a booking nobody accepted in time.
  perform cron.schedule('dep360-expire-bookings', '*/5 * * * *', 'select public.expire_stale_bookings()');

  -- Every fifteen minutes: close requests whose time has passed, and offers that ran out.
  perform cron.schedule('dep360-expire-jobs', '*/15 * * * *', 'select public.expire_stale_jobs()');

  -- Every ten minutes: the T-24h and T-2h reminders, one of each per booking.
  perform cron.schedule('dep360-reminders', '*/10 * * * *', 'select public.send_booking_reminders()');

  -- 02:00 in Vietnam: recompute job counts, response times and ratings from what
  -- actually happened, so no number on a profile is one somebody typed in.
  perform cron.schedule('dep360-metrics', '0 19 * * *', 'select public.recompute_pro_metrics()');

  -- Hourly: a freelancer whose prepaid wallet is too far below zero stops
  -- receiving new jobs, and is told why.
  perform cron.schedule('dep360-wallet', '0 * * * *', 'select public.enforce_wallet_threshold()');
end $$;
