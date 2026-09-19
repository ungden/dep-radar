-- Postgres grants EXECUTE on a new function to PUBLIC, and the earlier
-- `alter default privileges` only covers functions created by the role that set
-- it -- which is not the role migrations run as on the hosted project. So every
-- function added since then (the admin decisions, account deletion, chat) came
-- back out with a grant to PUBLIC.
--
-- None of them were exploitable: each checks is_admin() or auth.uid() first and
-- raises. But relying on every future function remembering to do that is how a
-- real hole eventually gets in, so revoke from PUBLIC again, grant back the
-- intended set, and set the default for both creating roles. The assertion at
-- the bottom of supabase/tests/rules.sql fails the build if this drifts again.

revoke execute on all functions in schema public from public, anon, authenticated;

-- Setting the default for the creating role would be the tidy fix, but the
-- migration role is not allowed to change another role's defaults on the hosted
-- project. So the guard is the assertion in supabase/tests/rules.sql instead:
-- CI fails if a new function is reachable by anon or by a signed-in user
-- without being on the list below.
do $$
begin
  execute 'alter default privileges in schema public revoke execute on functions from public';
exception when insufficient_privilege then
  raise notice 'cannot set default privileges here; the test in rules.sql is the guard';
end $$;

-- Read-only, and useful before signing in: prices, fees, whether a slot is free.
grant execute on function
  public.app_timezone(),
  public.travel_distance_km(double precision, double precision, double precision, double precision, numeric),
  public.travel_fee(numeric),
  public.commission_for(int, numeric),
  public.is_urgent(timestamptz, timestamptz),
  public.build_quote(int, int, boolean, numeric, boolean),
  public.service_duration_min(text, text, int),
  public.listed_price(uuid, text, text),
  public.within_working_hours(uuid, timestamptz, int),
  public.availability_problem(uuid, text, text, int, timestamptz, boolean, double precision, double precision, uuid),
  public.free_slots(uuid, text, text, int, date, boolean, double precision, double precision),
  public.slugify(text)
to anon, authenticated;

-- Row level security policies call these, so the caller needs EXECUTE.
grant execute on function public.is_admin(), public.is_pro() to anon, authenticated;

-- Everything a signed-in person does: the state machine, chat, their account.
grant execute on function
  public.create_booking(uuid, text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.confirm_booking(uuid),
  public.decline_booking(uuid, text),
  public.start_booking(uuid),
  public.complete_booking(uuid),
  public.mark_no_show(uuid, text),
  public.cancel_booking(uuid, text),
  public.request_reschedule(uuid, timestamptz),
  public.respond_reschedule(uuid, boolean),
  public.post_job(text, text, timestamptz, boolean, uuid, int, text, public.payment_method),
  public.send_offer(uuid, int, text),
  public.accept_offer(uuid),
  public.withdraw_offer(uuid),
  public.write_review(uuid, int, text[], text, text[]),
  public.reply_review(uuid, text),
  public.open_thread(uuid, uuid),
  public.delete_my_account()
to authenticated;

-- Admin decisions. The functions check is_admin() themselves; this stops an
-- anonymous caller reaching them at all.
grant execute on function
  public.decide_identity_check(uuid, boolean, text),
  public.set_pro_suspended(uuid, boolean, text),
  public.set_review_hidden(uuid, boolean),
  public.resolve_report(uuid, text, text)
to authenticated;

-- notify(), the guards, the triggers, the cron work and wallet_balance() stay
-- reachable only by the platform itself.
grant execute on all functions in schema public to service_role;
