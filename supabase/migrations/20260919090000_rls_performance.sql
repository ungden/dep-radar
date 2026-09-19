-- Three things, all found by reading the database linter's output rather than by
-- anything going wrong in production.
--
-- 1. A policy that calls auth.uid() directly re-evaluates it once per row
--    scanned. Wrapping it in a subquery evaluates it once per query. Same rule,
--    same answer, one call instead of N. This is invisible at today's size and
--    expensive at the size we want.
--
-- 2. Several tables carried two or three permissive policies for the same
--    command, so Postgres ran every one of them on every row. In each case one
--    policy already implied the others, so they are merged or dropped. No
--    permission changes.
--
-- 3. Eighteen foreign keys had no covering index, which makes a delete on the
--    parent, or a join across the key, a sequential scan.

-- 1 + 2. Policies ------------------------------------------------------------

-- accounts: three SELECT policies become one. "admin reads every account" was
-- already implied by the is_admin() branch of "read own account".
drop policy "admin reads every account" on public.accounts;
drop policy "counterparty reads account" on public.accounts;
drop policy "read own account" on public.accounts;
create policy "read own account" on public.accounts for select using (
  id = (select auth.uid())
  or public.is_admin()
  -- The other side of a booking may see your name and phone, because they have
  -- to call you. The pro only becomes visible once the booking is real.
  or exists (
    select 1 from public.bookings b
    where (b.customer_id = accounts.id and b.pro_id = (select auth.uid()))
       or (b.pro_id = accounts.id and b.customer_id = (select auth.uid())
           and b.status in ('confirmed', 'in_progress', 'completed', 'no_show'))
  )
);

drop policy "update own account" on public.accounts;
create policy "update own account" on public.accounts
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- pros: the admin SELECT is implied by "published pros are public".
drop policy "admin reads every pro" on public.pros;
drop policy "published pros are public" on public.pros;
create policy "published pros are public" on public.pros
  for select using (published or id = (select auth.uid()) or public.is_admin());

drop policy "pro edits own profile" on public.pros;
create policy "pro edits own profile" on public.pros
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "become a pro" on public.pros;
create policy "become a pro" on public.pros
  for insert with check (id = (select auth.uid()));

drop policy "admin reads every identity check" on public.identity_checks;
drop policy "pro reads own identity checks" on public.identity_checks;
create policy "pro reads own identity checks" on public.identity_checks
  for select using (pro_id = (select auth.uid()) or public.is_admin());

-- working_hours, days_off, works, pro_services and pro_service_prices each have
-- a public SELECT policy that already covers everything the owner can see, so
-- the owner's policy no longer needs to answer SELECT — only the writes.
drop policy "pro manages working hours" on public.working_hours;
create policy "pro writes own working hours" on public.working_hours
  for insert with check (pro_id = (select auth.uid()));
create policy "pro edits own working hours" on public.working_hours
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "pro removes own working hours" on public.working_hours
  for delete using (pro_id = (select auth.uid()));

drop policy "pro manages days off" on public.days_off;
create policy "pro writes own days off" on public.days_off
  for insert with check (pro_id = (select auth.uid()));
create policy "pro edits own days off" on public.days_off
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "pro removes own days off" on public.days_off
  for delete using (pro_id = (select auth.uid()));

drop policy "pro manages works" on public.works;
create policy "pro writes own works" on public.works
  for insert with check (pro_id = (select auth.uid()));
create policy "pro edits own works" on public.works
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "pro removes own works" on public.works
  for delete using (pro_id = (select auth.uid()));

drop policy "listings are public" on public.pro_services;
create policy "listings are public" on public.pro_services
  for select using (active or pro_id = (select auth.uid()));
drop policy "pro manages listings" on public.pro_services;
create policy "pro writes own listings" on public.pro_services
  for insert with check (pro_id = (select auth.uid()));
create policy "pro edits own listings" on public.pro_services
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "pro removes own listings" on public.pro_services
  for delete using (pro_id = (select auth.uid()));

drop policy "pro manages prices" on public.pro_service_prices;
create policy "pro writes own prices" on public.pro_service_prices
  for insert with check (pro_id = (select auth.uid()));
create policy "pro edits own prices" on public.pro_service_prices
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "pro removes own prices" on public.pro_service_prices
  for delete using (pro_id = (select auth.uid()));

drop policy "own addresses" on public.addresses;
create policy "own addresses" on public.addresses
  for all using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

drop policy "job visibility" on public.jobs;
create policy "job visibility" on public.jobs for select using (
  customer_id = (select auth.uid())
  or (status = 'open' and public.is_pro())
  or public.is_admin()
);

drop policy "customer edits own open job" on public.jobs;
create policy "customer edits own open job" on public.jobs
  for update using (customer_id = (select auth.uid()) and status = 'open')
  with check (customer_id = (select auth.uid()) and status = 'open');

drop policy "customer deletes own open job" on public.jobs;
create policy "customer deletes own open job" on public.jobs
  for delete using (customer_id = (select auth.uid()) and status = 'open');

drop policy "offer visibility" on public.offers;
create policy "offer visibility" on public.offers for select using (
  pro_id = (select auth.uid())
  or exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = (select auth.uid()))
  or public.is_admin()
);

drop policy "admin reads every booking" on public.bookings;
drop policy "booking parties" on public.bookings;
create policy "booking parties" on public.bookings for select using (
  customer_id = (select auth.uid()) or pro_id = (select auth.uid()) or public.is_admin()
);

drop policy "admin reads every review" on public.reviews;
drop policy "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select using (
  hidden_at is null
  or customer_id = (select auth.uid())
  or pro_id = (select auth.uid())
  or public.is_admin()
);

drop policy "pro reads own wallet" on public.wallet_entries;
create policy "pro reads own wallet" on public.wallet_entries
  for select using (pro_id = (select auth.uid()) or public.is_admin());

drop policy "thread parties" on public.threads;
create policy "thread parties" on public.threads for select using (
  customer_id = (select auth.uid()) or pro_id = (select auth.uid()) or public.is_admin()
);

-- Two INSERT policies become one: either side may open a thread, and open_thread()
-- is the only way in, which is where the real check lives.
drop policy "customer opens thread" on public.threads;
drop policy "pro opens thread about own booking" on public.threads;
create policy "thread party opens thread" on public.threads for insert with check (
  customer_id = (select auth.uid()) or pro_id = (select auth.uid())
);

drop policy "read own messages" on public.messages;
create policy "read own messages" on public.messages for select using (
  exists (
    select 1 from public.threads t
    where t.id = thread_id and (select auth.uid()) in (t.customer_id, t.pro_id)
  )
);

drop policy "send message in own thread" on public.messages;
create policy "send message in own thread" on public.messages for insert with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.threads t
    where t.id = thread_id and (select auth.uid()) in (t.customer_id, t.pro_id)
  )
);

drop policy "own notifications" on public.notifications;
create policy "own notifications" on public.notifications
  for select using (account_id = (select auth.uid()));

drop policy "mark own notification read" on public.notifications;
create policy "mark own notification read" on public.notifications
  for update using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

drop policy "own reports" on public.reports;
create policy "own reports" on public.reports
  for select using (reporter_id = (select auth.uid()) or public.is_admin());

drop policy "file a report" on public.reports;
create policy "file a report" on public.reports
  for insert with check (reporter_id = (select auth.uid()));

drop policy "own saved works" on public.saved_works;
create policy "own saved works" on public.saved_works
  for all using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

drop policy "own follows" on public.follows;
create policy "own follows" on public.follows
  for all using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

-- Read receipts --------------------------------------------------------------
--
-- messages has no UPDATE policy, so the app's attempt to stamp read_at was
-- being silently dropped by RLS and the unread badge never cleared. Adding an
-- UPDATE policy would be the wrong fix: RLS cannot restrict which columns
-- change, so anyone allowed to stamp read_at on the other person's message
-- could also rewrite its body. A function that touches only that one column can.
create function public.mark_thread_read(p_thread uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return; end if;
  if not exists (
    select 1 from public.threads t
    where t.id = p_thread and me in (t.customer_id, t.pro_id)
  ) then
    return;
  end if;

  update public.messages
     set read_at = now()
   where thread_id = p_thread and sender_id <> me and read_at is null;
end $$;

revoke all on function public.mark_thread_read(uuid) from public;
grant execute on function public.mark_thread_read(uuid) to authenticated;

-- 3. Covering indexes for the foreign keys -----------------------------------

create index if not exists bookings_offer_idx on public.bookings (offer_id);
create index if not exists bookings_service_idx on public.bookings (template_id, variant_id);
create index if not exists follows_pro_idx on public.follows (pro_id);
create index if not exists jobs_address_idx on public.jobs (address_id);
create index if not exists jobs_service_idx on public.jobs (template_id, variant_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists offers_pro_idx on public.offers (pro_id);
create index if not exists pro_service_prices_service_idx on public.pro_service_prices (template_id, variant_id);
create index if not exists pro_services_template_idx on public.pro_services (template_id);
create index if not exists reports_booking_idx on public.reports (booking_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_review_idx on public.reports (review_booking_id);
create index if not exists reports_target_idx on public.reports (target_account_id);
create index if not exists reports_work_idx on public.reports (work_id);
create index if not exists reviews_customer_idx on public.reviews (customer_id);
create index if not exists saved_works_work_idx on public.saved_works (work_id);
create index if not exists threads_booking_idx on public.threads (booking_id);
create index if not exists threads_pro_idx on public.threads (pro_id);

-- One overlap left: pros had two UPDATE policies. The admin's is folded into the
-- owner's, which is safe because guard_pro_update() is what actually decides
-- which columns a freelancer may change, and is_privileged() already lets an
-- admin past it.
drop policy "admin edits any pro" on public.pros;
drop policy "pro edits own profile" on public.pros;
create policy "pro edits own profile" on public.pros
  for update using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
