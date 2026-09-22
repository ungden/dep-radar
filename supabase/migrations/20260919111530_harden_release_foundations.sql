-- Release blockers: private chat attachments, authorization-only message writes,
-- correct availability under RLS, and deletion that actually removes personal data.

-- Chat media is never a public object. The browser may upload only to its own
-- prefix; a server action signs each path only after RLS has admitted the message.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "owner uploads private chat media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "owner deletes private chat media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'chat' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Thread creation and message writes are business operations, never raw table
-- inserts. This removes the policy path that could create arbitrary threads.
drop policy "thread party opens thread" on public.threads;
drop policy "send message in own thread" on public.messages;

create function public.send_message(p_thread uuid, p_body text default '', p_image_paths text[] default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); thread_row public.threads;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into thread_row from public.threads where id = p_thread for share;
  if thread_row is null or me not in (thread_row.customer_id, thread_row.pro_id) then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_body, ''))) = 0 and coalesce(array_length(p_image_paths, 1), 0) = 0 then
    raise exception 'Nhập tin nhắn.' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_image_paths, 1), 0) > 6
     or exists (select 1 from unnest(coalesce(p_image_paths, '{}')) path where path !~ ('^' || me::text || '/[0-9a-f-]+\\.jpg$')) then
    raise exception 'Ảnh chat không hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.messages (thread_id, sender_id, body, image_paths)
  values (p_thread, me, left(trim(coalesce(p_body, '')), 2000), coalesce(p_image_paths, '{}'));
end $$;

-- The caller may not see other customers' bookings, but this function must see
-- their occupied ranges to return a truthful list of slot timestamps only.
alter function public.availability_problem(uuid, text, text, int, timestamptz, boolean, double precision, double precision, uuid)
  security definer set search_path = '';
alter function public.free_slots(uuid, text, text, int, date, boolean, double precision, double precision)
  security definer set search_path = '';

-- Account deletion is an explicitly permitted self-anonymization path. The
-- guards still prevent ordinary profile edits from changing protected fields.
create or replace function public.guard_account_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_privileged()
     and not (old.id = auth.uid() and new.full_name = 'Người dùng đã xoá' and new.phone = '' and new.avatar_path is null) then
    new.is_admin := old.is_admin;
    new.phone := old.phone;
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

create or replace function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare deleting boolean := old.id = auth.uid()
  and new.display_name = 'Chuyên viên đã rời nền tảng'
  and new.published = false
  and new.avatar_path is null;
begin
  if not public.is_privileged() and not deleting then
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
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.' using errcode = 'check_violation';
      end if;
    end if;
  end if;
  if not deleting and coalesce(new.identity_name, '') <> '' and new.identity_status = 'verified' then new.display_name := new.identity_name; end if;
  if not deleting and coalesce(new.display_name, '') = '' then new.display_name := old.display_name; end if;
  return new;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  perform 1 from public.accounts where id = me for update;
  if exists (select 1 from public.bookings where (customer_id = me or pro_id = me) and status in ('pending', 'confirmed', 'in_progress')) then
    raise exception 'Bạn còn lịch hẹn chưa hoàn tất.' using errcode = 'check_violation';
  end if;

  delete from storage.objects where bucket_id in ('avatars', 'works', 'reviews', 'chat') and name like me::text || '/%';
  delete from public.addresses where account_id = me;
  delete from public.saved_works where account_id = me;
  delete from public.follows where account_id = me;
  delete from public.notifications where account_id = me;
  delete from public.jobs where customer_id = me;
  delete from public.works where pro_id = me;
  delete from public.days_off where pro_id = me;
  delete from public.working_hours where pro_id = me;
  delete from public.pro_service_prices where pro_id = me;
  delete from public.pro_services where pro_id = me;
  delete from public.identity_checks where pro_id = me;

  update public.messages set image_paths = '{}' where sender_id = me;
  update public.threads set customer_name = 'Người dùng đã xoá' where customer_id = me;
  update public.reviews set author_name = 'Người dùng đã xoá', photo_paths = '{}' where customer_id = me;
  update public.pros set display_name = 'Chuyên viên đã rời nền tảng', published = false,
    suspended_at = now(), accepting_jobs = false, bio = '', avatar_path = null,
    identity_status = 'none', identity_name = null, studio_address = null,
    lat = null, lng = null, areas = '{}' where id = me;
  update public.accounts set full_name = 'Người dùng đã xoá', phone = '', avatar_path = null where id = me;

  delete from auth.sessions where user_id = me;
  delete from auth.identities where user_id = me;
  update auth.users set phone = null, email = null, encrypted_password = null,
    raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity' where id = me;
end $$;

revoke execute on function public.send_message(uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.send_message(uuid, text, text[]) to authenticated;

-- Replace a week's hours in one transaction so a transient network failure can
-- never leave a published profile with half a schedule.
create function public.replace_working_hours(p_windows jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); item jsonb; weekday int; start_min int; end_min int;
begin
  if me is null or not exists (select 1 from public.pros where id = me) then
    raise exception 'Chỉ chuyên viên mới sửa giờ làm việc.' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(coalesce(p_windows, '[]'::jsonb)) <> 'array' then raise exception 'Giờ làm việc không hợp lệ.' using errcode = 'check_violation'; end if;
  for item in select value from jsonb_array_elements(coalesce(p_windows, '[]'::jsonb)) loop
    weekday := (item->>'weekday')::int;
    start_min := (item->>'startMin')::int;
    end_min := (item->>'endMin')::int;
    if weekday not between 0 and 6 or start_min not between 0 and 1380 or end_min not between 30 and 1440 or start_min >= end_min then
      raise exception 'Giờ làm việc không hợp lệ.' using errcode = 'check_violation';
    end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(coalesce(p_windows, '[]'::jsonb)) a
    join jsonb_array_elements(coalesce(p_windows, '[]'::jsonb)) b
      on (a->>'weekday')::int = (b->>'weekday')::int
     and (a->>'startMin')::int < (b->>'endMin')::int
     and (b->>'startMin')::int < (a->>'endMin')::int
     and a < b
  ) then raise exception 'Các khung giờ trong cùng ngày không được chồng lên nhau.' using errcode = 'check_violation'; end if;
  delete from public.working_hours where pro_id = me;
  insert into public.working_hours (pro_id, weekday, start_min, end_min)
  select me, (value->>'weekday')::int, (value->>'startMin')::int, (value->>'endMin')::int
  from jsonb_array_elements(coalesce(p_windows, '[]'::jsonb));
end $$;
revoke execute on function public.replace_working_hours(jsonb) from public, anon, authenticated;
grant execute on function public.replace_working_hours(jsonb) to authenticated;

-- The UI's history is intentionally paged; this total must not be calculated
-- from its first 200 rows.
create function public.my_wallet_balance() returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(amount), 0)::int from public.wallet_entries where pro_id = auth.uid()
$$;
revoke execute on function public.my_wallet_balance() from public, anon, authenticated;
grant execute on function public.my_wallet_balance() to authenticated;

-- Job-board readers are not entitled to a customer's account row (and phone),
-- so keep only the name needed to address an open request on the request itself.
alter table public.jobs add column customer_name text not null default 'Khách hàng';
update public.jobs j set customer_name = coalesce(nullif(a.full_name, ''), 'Khách hàng') from public.accounts a where a.id = j.customer_id;

create or replace function public.post_job(
  p_template text, p_variant text, p_starts_at timestamptz, p_at_home boolean,
  p_address_id uuid default null, p_quantity int default 1, p_description text default '',
  p_payment public.payment_method default 'cash'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); addr record; policy record; variant record; new_id uuid; who text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into policy from public.fee_policy where id;
  select * into variant from public.service_variants where template_id = p_template and id = p_variant;
  if variant is null or p_quantity < 1 or p_quantity > variant.max_quantity then
    raise exception 'Số người không hợp lệ cho gói dịch vụ này.' using errcode = 'check_violation';
  end if;
  if extract(epoch from (p_starts_at - now())) / 60 < policy.min_lead_minutes then
    raise exception 'Cần đặt trước ít nhất % phút.', policy.min_lead_minutes using errcode = 'check_violation';
  end if;
  if not p_at_home then raise exception 'Yêu cầu báo giá hiện chỉ dành cho dịch vụ tại nhà.' using errcode = 'feature_not_supported'; end if;
  select * into addr from public.addresses where id = p_address_id and account_id = me;
  if addr is null then raise exception 'Cần chọn địa chỉ đã lưu.' using errcode = 'check_violation'; end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = me;
  insert into public.jobs (customer_id, customer_name, template_id, variant_id, quantity, description,
                           starts_at, at_home, address_id, city, district, payment_method)
  values (me, who, p_template, p_variant, p_quantity, left(coalesce(p_description, ''), 500),
          p_starts_at, true, p_address_id, addr.city, addr.district, p_payment) returning id into new_id;
  return new_id;
end $$;

-- A deadline and an accepted offer are state transitions. Lock their row before
-- reading it so two requests cannot both win based on an old snapshot.
create or replace function public.confirm_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b is null or b.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status <> 'pending' then raise exception 'Lịch hẹn không còn ở trạng thái chờ xác nhận.' using errcode = 'check_violation'; end if;
  if now() > b.confirm_by then
    update public.bookings set status = 'expired', cancelled_at = now(), cancel_reason = 'Quá hạn xác nhận' where id = b.id;
    raise exception 'Đã quá hạn xác nhận lịch hẹn.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'confirmed', confirmed_at = now() where id = b.id;
  perform public.notify(b.customer_id, 'booking_confirmed', 'Chuyên viên đã nhận lịch', 'Hẹn gặp bạn đúng giờ.', '/bookings/' || p_booking);
end $$;

create or replace function public.accept_offer(p_offer uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); offer public.offers; job public.jobs; addr public.addresses; pro public.pros; policy public.fee_policy;
  minutes int; km numeric; q public.quote; problem text; new_id uuid;
begin
  select * into offer from public.offers where id = p_offer for update;
  if offer is null then raise exception 'Không tìm thấy báo giá.' using errcode = 'no_data_found'; end if;
  select * into job from public.jobs where id = offer.job_id for update;
  if job.customer_id <> me then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if job.status <> 'open' then raise exception 'Yêu cầu này đã được chốt.' using errcode = 'check_violation'; end if;
  if offer.status <> 'pending' or offer.expires_at < now() then raise exception 'Báo giá không còn hiệu lực.' using errcode = 'check_violation'; end if;
  select * into pro from public.pros where id = offer.pro_id;
  select * into policy from public.fee_policy where id;
  select * into addr from public.addresses where id = job.address_id and account_id = me;
  if addr is null then raise exception 'Địa chỉ của yêu cầu không còn.' using errcode = 'check_violation'; end if;
  problem := public.availability_problem(offer.pro_id, job.template_id, job.variant_id, job.quantity, job.starts_at, job.at_home, addr.lat, addr.lng);
  if problem is not null then raise exception '%', problem using errcode = 'check_violation'; end if;
  minutes := public.service_duration_min(job.template_id, job.variant_id, job.quantity);
  km := public.travel_distance_km(pro.lat, pro.lng, addr.lat, addr.lng, policy.road_factor);
  -- An offer is the same per-person unit price used by direct booking.
  q := public.build_quote(offer.price, job.quantity, job.at_home, km, public.is_urgent(job.starts_at));
  insert into public.bookings (customer_id, pro_id, template_id, variant_id, quantity, offer_id, source, starts_at, duration_min, buffer_min,
    at_home, city, district, address, address_note, lat, lng, note, service_price, distance_km, travel_fee, urgent_fee, commission_rate, commission,
    payment_method, status, confirm_by)
  values (me, offer.pro_id, job.template_id, job.variant_id, job.quantity, offer.id, 'job', job.starts_at, minutes, pro.buffer_min,
    job.at_home, addr.city, addr.district, addr.detail, addr.note, addr.lat, addr.lng, job.description, q.service_price, q.distance_km, q.travel_fee,
    q.urgent_fee, q.commission_rate, q.commission, job.payment_method, 'pending', least(job.starts_at, now() + make_interval(hours => policy.confirm_within_hours)))
  returning id into new_id;
  update public.offers set status = 'accepted' where id = offer.id;
  update public.offers set status = 'rejected' where job_id = job.id and id <> offer.id and status = 'pending';
  update public.jobs set status = 'booked' where id = job.id;
  perform public.notify(offer.pro_id, 'offer_accepted', 'Báo giá của bạn được chọn', 'Gọi cho khách để xác nhận nhận job.', '/studio/jobs');
  return new_id;
exception when exclusion_violation then raise exception 'Chuyên viên vừa có lịch khác vào giờ này.' using errcode = 'check_violation';
end $$;

-- A no-show report is evidence for operations, not an automatic wallet credit.
create table public.no_show_compensation_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  pro_id uuid not null references public.pros(id) on delete cascade,
  amount int not null check (amount >= 0),
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.accounts(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);
alter table public.no_show_compensation_requests enable row level security;
create policy "pro reads own no show compensation" on public.no_show_compensation_requests for select using (pro_id = (select auth.uid()) or public.is_admin());

create or replace function public.mark_no_show(p_booking uuid, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking for update;
  if b is null or b.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if b.status not in ('confirmed', 'in_progress') then raise exception 'Chỉ báo vắng mặt cho job đã xác nhận.' using errcode = 'check_violation'; end if;
  if now() < b.starts_at + interval '15 minutes' then raise exception 'Đợi ít nhất 15 phút sau giờ hẹn rồi hãy báo vắng mặt.' using errcode = 'check_violation'; end if;
  update public.bookings set status = 'no_show', cancelled_at = now(), cancelled_by = 'customer',
    cancel_reason = left(coalesce(p_reason, 'Khách không có mặt'), 300) where id = b.id;
  if b.travel_fee > 0 then
    insert into public.no_show_compensation_requests (booking_id, pro_id, amount, reason)
    values (b.id, b.pro_id, b.travel_fee, left(coalesce(p_reason, ''), 300)) on conflict (booking_id) do nothing;
  end if;
  perform public.notify(b.customer_id, 'booking_no_show', 'Chuyên viên báo bạn không có mặt', 'Nếu có nhầm lẫn, hãy liên hệ hỗ trợ.', '/bookings/' || p_booking);
end $$;

create function public.decide_no_show_compensation(p_request uuid, p_approve boolean, p_note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare claim public.no_show_compensation_requests;
begin
  if not public.is_admin() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  select * into claim from public.no_show_compensation_requests where id = p_request for update;
  if claim is null or claim.status <> 'pending' then raise exception 'Yêu cầu bù phí không còn chờ xử lý.' using errcode = 'check_violation'; end if;
  update public.no_show_compensation_requests set status = case when p_approve then 'approved' else 'rejected' end,
    decided_by = auth.uid(), decided_at = now(), decision_note = left(p_note, 500) where id = claim.id;
  if p_approve then
    insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
    values (claim.pro_id, claim.booking_id, 'no_show_comp', claim.amount, 'Bù phí di chuyển đã duyệt')
    on conflict (booking_id, kind) do nothing;
  end if;
end $$;
revoke execute on function public.decide_no_show_compensation(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.decide_no_show_compensation(uuid, boolean, text) to authenticated;
