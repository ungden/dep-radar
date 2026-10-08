-- Partner onboarding, per the owner's spec (08/10/2026):
--
-- 1. Identity (KYC) opens, AI first and the staff for the uncertain cases.
--    Only those cases keep their three photos (front, back, portrait holding
--    the card), in a private bucket nobody but the server reads; the staff see
--    them through short-lived links and the photos go when the case is decided.
--    A partner whose profile waits only on identity goes back to the review
--    queue the moment they are verified.
-- 2. Where partners are paid: bank, account, holder and their own QR code,
--    readable by the partner and the staff only. Shown to the customer on the
--    partner's screen at the end of a job.
-- 3. A start point: the partner may set where they leave from (their phone's
--    location), close to the district they work in, instead of the district
--    centre. Travel is measured from there.

-- 1 ---------------------------------------------------------------------------
alter table public.identity_checks add column image_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity', 'identity', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
-- No storage policy for this bucket: only the service role (the server) reads or writes it.

create function public.identity_requeue_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.identity_status = 'verified' and old.identity_status is distinct from 'verified'
     and new.review_status = 'changes_requested' and not new.published then
    new.review_status := 'pending';
    new.review_requested_at := now();
  end if;
  return new;
end $$;
revoke all on function public.identity_requeue_review() from public, anon, authenticated;
-- After the other row triggers, so nothing resets what it sets.
create trigger zz_pros_identity_requeue before update of identity_status on public.pros
  for each row execute function public.identity_requeue_review();

-- 2 ---------------------------------------------------------------------------
create table public.pro_payout (
  pro_id uuid primary key references public.pros (id) on delete cascade,
  bank_name text not null check (char_length(trim(bank_name)) between 2 and 80),
  account_number text not null check (account_number ~ '^[0-9]{6,20}$'),
  account_holder text not null check (char_length(trim(account_holder)) between 2 and 80),
  -- Path in the private payout bucket: '<pro_id>/<file>'.
  qr_path text check (qr_path is null or split_part(qr_path, '/', 1) = pro_id::text),
  updated_at timestamptz not null default now()
);
alter table public.pro_payout enable row level security;
create policy "partner reads own payout" on public.pro_payout for select using (pro_id = (select auth.uid()) or (select public.is_admin()));
create policy "partner writes own payout" on public.pro_payout for insert with check (pro_id = (select auth.uid()));
create policy "partner edits own payout" on public.pro_payout for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "partner removes own payout" on public.pro_payout for delete using (pro_id = (select auth.uid()));
grant select, insert, update, delete on public.pro_payout to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payout', 'payout', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "partner uploads own payout qr" on storage.objects for insert to authenticated
  with check (bucket_id = 'payout' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "partner reads own payout qr" on storage.objects for select to authenticated
  using (bucket_id = 'payout' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy "partner replaces own payout qr" on storage.objects for update to authenticated
  using (bucket_id = 'payout' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'payout' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "partner removes own payout qr" on storage.objects for delete to authenticated
  using (bucket_id = 'payout' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3 ---------------------------------------------------------------------------
alter table public.pros add column start_label text check (start_label is null or char_length(start_label) <= 120);

create function public.set_start_point(p_lat double precision, p_lng double precision, p_label text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); pro public.pros; d public.districts; km numeric;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into pro from public.pros where id = me;
  if pro is null then raise exception 'Cần tạo hồ sơ đối tác trước.' using errcode = 'check_violation'; end if;
  if p_lat is null or p_lng is null or p_lat not between 8 and 24 or p_lng not between 102 and 110 then
    raise exception 'Vị trí không hợp lệ.' using errcode = 'check_violation';
  end if;
  select * into d from public.districts where city = pro.city and district = pro.district;
  -- Straight line from the district centre: a start point is where you live or
  -- work, not a way to change who counts as near.
  km := public.travel_distance_km(d.lat, d.lng, p_lat, p_lng, 1);
  if km is null or km > 15 then
    raise exception 'Điểm xuất phát cách khu vực đã khai (%) hơn 15 km. Đổi khu vực trong hồ sơ trước.', pro.district using errcode = 'check_violation';
  end if;
  perform set_config('app.system_write', 'on', true);
  update public.pros set lat = p_lat, lng = p_lng, start_label = nullif(left(trim(coalesce(p_label, '')), 120), '') where id = me;
  perform set_config('app.system_write', 'off', true);
end $$;
revoke all on function public.set_start_point(double precision, double precision, text) from public, anon;
grant execute on function public.set_start_point(double precision, double precision, text) to authenticated;

-- Moving to another district puts the point back on the district centre (guard_partner_setup); the label goes with it.
create function public.start_label_follows_district() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.city is distinct from old.city or new.district is distinct from old.district then
    new.start_label := null;
  end if;
  return new;
end $$;
revoke all on function public.start_label_follows_district() from public, anon, authenticated;
create trigger pros_start_label_follows_district before update of city, district on public.pros
  for each row execute function public.start_label_follows_district();
