-- A public profile needs a name and a photo, but `accounts` is private: it holds
-- the phone number. Reading the name through a join therefore returned nothing,
-- and the whole feed came back empty.
--
-- Split the two: what the public may see lives on `pros` and on the review, and
-- `accounts` stays private and reachable only by the other party on a booking.

alter table public.pros
  add column display_name text not null default '',
  add column avatar_path text;

update public.pros p
set display_name = coalesce(nullif(p.identity_name, ''), a.full_name, 'Chuyên viên'),
    avatar_path = a.avatar_path
from public.accounts a
where a.id = p.id;

-- A review shows who wrote it, so the name is snapshotted when it is written.
-- It is also the honest thing: the review was left by that person, then.
alter table public.reviews add column author_name text not null default 'Khách hàng';

update public.reviews r
set author_name = coalesce(nullif(a.full_name, ''), 'Khách hàng')
from public.accounts a
where a.id = r.customer_id;

create or replace function public.write_review(
  p_booking uuid, p_rating int, p_tags text[], p_body text, p_photo_paths text[] default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; who text;
begin
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá được job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = b.customer_id;
  insert into public.reviews (booking_id, pro_id, customer_id, author_name, rating, tags, body, photo_paths)
  values (p_booking, b.pro_id, b.customer_id, who, p_rating, coalesce(p_tags, '{}'), p_body, coalesce(p_photo_paths, '{}'))
  on conflict (booking_id) do update
    set rating = excluded.rating, tags = excluded.tags, body = excluded.body,
        photo_paths = excluded.photo_paths, created_at = now();
  perform public.refresh_pro_rating(b.pro_id);
  perform public.notify(b.pro_id, 'review_new', 'Bạn có đánh giá mới', '', '/pros/' || b.pro_id);
end $$;

-- A new freelancer profile starts with the name on the account.
create or replace function public.guard_pro_insert() returns trigger
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
  if coalesce(new.display_name, '') = '' then
    select coalesce(nullif(full_name, ''), 'Chuyên viên') into new.display_name
      from public.accounts where id = new.id;
  end if;
  return new;
end $$;

-- A verified freelancer is shown under the name on their ID card, not a nickname.
create or replace function public.guard_pro_update() returns trigger
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
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;
  if coalesce(new.identity_name, '') <> '' and new.identity_status = 'verified' then
    new.display_name := new.identity_name;
  end if;
  if coalesce(new.display_name, '') = '' then
    new.display_name := old.display_name;
  end if;
  return new;
end $$;

-- The other party on a booking can read the account, which is how a phone number
-- reaches the person who has to make the call. The freelancer gets the customer's
-- number as soon as there is a booking to call about; the customer gets the
-- freelancer's only once the job has actually been accepted.
create policy "counterparty reads account" on public.accounts for select using (
  exists (
    select 1 from public.bookings b
    where (b.customer_id = accounts.id and b.pro_id = auth.uid())
       or (b.pro_id = accounts.id and b.customer_id = auth.uid()
           and b.status in ('confirmed', 'in_progress', 'completed', 'no_show'))
  )
);
