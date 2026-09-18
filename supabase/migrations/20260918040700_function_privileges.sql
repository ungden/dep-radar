-- Postgres grants EXECUTE on a new function to PUBLIC, so the earlier
-- `revoke ... from authenticated, anon` statements left the grant to PUBLIC in
-- place. Anyone with the anon key could have called the maintenance functions --
-- enforce_wallet_threshold() alone could stop every freelancer from taking jobs.
--
-- Start from nothing and grant back deliberately.

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;

-- Read-only, and useful before signing in: prices, fees and whether a slot is
-- bookable. Showing a customer the real total before they log in is the point.
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
  public.free_slots(uuid, text, text, int, date, boolean, double precision, double precision)
to anon, authenticated;

-- Row level security policies call these, so the caller needs EXECUTE on them.
grant execute on function public.is_admin(), public.is_pro() to anon, authenticated;

-- The state machine: signed in only.
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
  public.reply_review(uuid, text)
to authenticated;

-- Everything else -- notify(), the guards, the cron work, wallet_balance(),
-- is_privileged() -- is reachable only by the platform itself.
grant execute on all functions in schema public to service_role;

-- btree_gist belongs next to the other extensions, not in the API schema. The
-- exclusion constraint that uses it keeps working: the objects move with it.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;
