-- Row level security. Nothing that costs money or changes a status is writable by a
-- client: those go through the security-definer RPCs. What is left here is profile,
-- listing, portfolio, address and message data owned by one account.

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.accounts where id = auth.uid()), false)
$$;

-- Trusted server context: an admin, or code holding the service key (no JWT
-- subject). RLS still blocks anonymous clients, whose auth.uid() is also null,
-- because every policy here compares it to a row owner.
create function public.is_privileged() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is null or public.is_admin()
$$;

create function public.is_pro() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pros where id = auth.uid())
$$;

grant execute on function public.is_admin(), public.is_pro() to authenticated;

alter table public.fee_policy enable row level security;
alter table public.service_templates enable row level security;
alter table public.service_variants enable row level security;
alter table public.districts enable row level security;
alter table public.accounts enable row level security;
alter table public.pros enable row level security;
alter table public.identity_checks enable row level security;
alter table public.working_hours enable row level security;
alter table public.days_off enable row level security;
alter table public.addresses enable row level security;
alter table public.pro_services enable row level security;
alter table public.pro_service_prices enable row level security;
alter table public.works enable row level security;
alter table public.jobs enable row level security;
alter table public.offers enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.wallet_entries enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.saved_works enable row level security;
alter table public.follows enable row level security;

-- Public reference data -------------------------------------------------------

create policy "policy is public" on public.fee_policy for select using (true);
create policy "catalogue is public" on public.service_templates for select using (active or public.is_admin());
create policy "options are public" on public.service_variants for select using (true);
create policy "districts are public" on public.districts for select using (true);

-- Accounts --------------------------------------------------------------------

create policy "read own account" on public.accounts
  for select using (id = auth.uid() or public.is_admin());
-- full_name/avatar/active_role only: is_admin is not writable because the policy
-- below is the only write path and update_profile() guards the rest.
create policy "update own account" on public.accounts
  for update using (id = auth.uid()) with check (id = auth.uid());

create function public.guard_account_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.is_admin := old.is_admin;
    new.phone := old.phone;            -- changing a phone means re-verifying it
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

create trigger account_update_guard
  before update on public.accounts
  for each row execute function public.guard_account_update();

-- Freelancer profiles ---------------------------------------------------------

create policy "published pros are public" on public.pros
  for select using (published or id = auth.uid() or public.is_admin());
create policy "pro edits own profile" on public.pros
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "become a pro" on public.pros
  for insert with check (id = auth.uid());

-- Metrics, verification and suspension are the platform's, not the freelancer's.
create function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_privileged() then
    new.identity_status := old.identity_status;
    new.identity_name := old.identity_name;
    new.suspended_at := old.suspended_at;
    new.completed_jobs := old.completed_jobs;
    new.response_minutes := old.response_minutes;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.slug := old.slug;
    -- A profile only goes public once it can actually take a booking.
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger pro_update_guard
  before update on public.pros
  for each row execute function public.guard_pro_update();

create function public.guard_pro_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.identity_status := 'none';
  new.identity_name := null;
  new.suspended_at := null;
  new.completed_jobs := 0;
  new.response_minutes := 0;
  new.rating_avg := 0;
  new.rating_count := 0;
  new.published := false;
  return new;
end $$;

create trigger pro_insert_guard
  before insert on public.pros
  for each row execute function public.guard_pro_insert();

create policy "pro reads own identity checks" on public.identity_checks
  for select using (pro_id = auth.uid() or public.is_admin());
-- Rows are written by the /api/identity route with the service role, never by a client.

-- Availability ----------------------------------------------------------------

create policy "working hours are public" on public.working_hours for select using (true);
create policy "pro manages working hours" on public.working_hours
  for all using (pro_id = auth.uid()) with check (pro_id = auth.uid());

create policy "days off are public" on public.days_off for select using (true);
create policy "pro manages days off" on public.days_off
  for all using (pro_id = auth.uid()) with check (pro_id = auth.uid());

-- Addresses are private: they are where someone lives.
create policy "own addresses" on public.addresses
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Listings & portfolio --------------------------------------------------------

create policy "listings are public" on public.pro_services
  for select using (active or pro_id = auth.uid());
create policy "pro manages listings" on public.pro_services
  for all using (pro_id = auth.uid()) with check (pro_id = auth.uid());

create policy "prices are public" on public.pro_service_prices for select using (true);
create policy "pro manages prices" on public.pro_service_prices
  for all using (pro_id = auth.uid()) with check (pro_id = auth.uid());

create policy "works are public" on public.works for select using (true);
create policy "pro manages works" on public.works
  for all using (pro_id = auth.uid()) with check (pro_id = auth.uid());

-- Requests & offers -----------------------------------------------------------

create policy "job visibility" on public.jobs for select using (
  customer_id = auth.uid()
  or (status = 'open' and public.is_pro())
  or public.is_admin()
);
create policy "customer edits own open job" on public.jobs
  for update using (customer_id = auth.uid() and status = 'open')
  with check (customer_id = auth.uid() and status = 'open');
create policy "customer deletes own open job" on public.jobs
  for delete using (customer_id = auth.uid() and status = 'open');
-- Insert goes through post_job().

create policy "offer visibility" on public.offers for select using (
  pro_id = auth.uid()
  or exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = auth.uid())
  or public.is_admin()
);
-- Writes go through send_offer() / accept_offer() / withdraw_offer().

-- Bookings, reviews, wallet ---------------------------------------------------

create policy "booking parties" on public.bookings
  for select using (customer_id = auth.uid() or pro_id = auth.uid() or public.is_admin());

create policy "reviews are public" on public.reviews
  for select using (hidden_at is null or customer_id = auth.uid() or pro_id = auth.uid() or public.is_admin());

create policy "pro reads own wallet" on public.wallet_entries
  for select using (pro_id = auth.uid() or public.is_admin());

-- Messaging & notifications ---------------------------------------------------

create policy "thread parties" on public.threads
  for select using (customer_id = auth.uid() or pro_id = auth.uid() or public.is_admin());
create policy "customer opens thread" on public.threads
  for insert with check (customer_id = auth.uid());

create policy "read own messages" on public.messages for select using (
  exists (select 1 from public.threads t where t.id = thread_id
          and (t.customer_id = auth.uid() or t.pro_id = auth.uid()))
);
create policy "send message in own thread" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.threads t where t.id = thread_id
              and (t.customer_id = auth.uid() or t.pro_id = auth.uid()))
);

create policy "own notifications" on public.notifications
  for select using (account_id = auth.uid());
create policy "mark own notification read" on public.notifications
  for update using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy "own reports" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
create policy "file a report" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "admin resolves reports" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- Saved & followed ------------------------------------------------------------

create policy "own saved works" on public.saved_works
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "own follows" on public.follows
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
