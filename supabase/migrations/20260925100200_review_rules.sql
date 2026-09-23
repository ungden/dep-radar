-- Reviews, the way Airbnb settled them after years of retaliation.
--
-- 1. A window: 14 days from the job's completion, for both sides.
-- 2. Double-blind: the customer's review of the freelancer and the freelancer's
--    review of the customer stay hidden from the other side (and the public)
--    until both are written or the 14 days are over. Nobody writes theirs after
--    reading the other's, so neither is a reply to the other. Until then the
--    author can still change what they wrote; after, it is a record.
-- 3. Tags come from a fixed list. Three stars or fewer needs at least one tag
--    saying what went wrong (the body says the rest), as Grab and Uber ask for
--    a reason; a freelancer rating a customer two stars or fewer writes why.
-- 4. The freelancer replies once, publicly, and the customer is told. A reply
--    that can be rewritten after the customer answers it is an argument.
-- 5. Ratings count published reviews only.
--
-- The lists match lib/trust.ts (REVIEW_TAGS, REVIEW_ISSUE_TAGS).

-- Everything written before today was already public, and so is anything an
-- admin or an import inserts directly; the two RPCs below write null (blind).
alter table public.reviews add column published_at timestamptz default now();
alter table public.customer_reviews add column published_at timestamptz default now();
update public.reviews set published_at = created_at;
update public.customer_reviews set published_at = created_at;

create function public.review_tags_ok(p_rating int, p_tags text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(p_tags, '{}') <@ array[
      'Đúng giờ', 'Tay nghề tốt', 'Dụng cụ sạch sẽ', 'Tư vấn kỹ', 'Nhẹ nhàng', 'Giá hợp lý', 'Bền đẹp',
      'Ảnh đẹp', 'Giao ảnh đúng hẹn', 'Chuyên nghiệp',
      'Trễ giờ', 'Tay nghề chưa tốt', 'Dụng cụ chưa sạch', 'Thái độ chưa tốt', 'Giá khác báo giá',
      'Giao ảnh trễ', 'Không giống mô tả']::text[]
    and (p_rating > 3 or coalesce(p_tags, '{}') && array[
      'Trễ giờ', 'Tay nghề chưa tốt', 'Dụng cụ chưa sạch', 'Thái độ chưa tốt', 'Giá khác báo giá',
      'Giao ảnh trễ', 'Không giống mô tả']::text[])
$$;

-- Both published at once when the second one is written, or when the window ends.
create function public.publish_reviews_for(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare pro uuid; customer uuid; newly boolean;
begin
  update public.reviews set published_at = now()
    where booking_id = p_booking and published_at is null
    returning pro_id, customer_id into pro, customer;
  newly := found;
  update public.customer_reviews set published_at = now()
    where booking_id = p_booking and published_at is null;
  if newly then
    perform public.refresh_pro_rating(pro);
    perform public.notify(pro, 'review_new', 'Đánh giá của khách đã hiện', 'Xem và trả lời trên hồ sơ của bạn.', '/pros/' || pro);
  end if;
end $$;

create function public.review_window_open(b public.bookings) returns boolean
language sql stable set search_path = '' as $$
  select b.status = 'completed' and b.completed_at is not null and now() <= b.completed_at + interval '14 days'
$$;

-- Same as 20260919025118, with the window, the blind and the tag rules.
create or replace function public.write_review(
  p_booking uuid, p_rating int, p_tags text[], p_body text, p_photo_paths text[] default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; who text; label text; existing public.reviews;
begin
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá được job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  if not public.review_window_open(b) then
    raise exception 'Đã quá 14 ngày kể từ khi hoàn thành, không thể đánh giá nữa.' using errcode = 'check_violation';
  end if;
  select * into existing from public.reviews where booking_id = p_booking;
  if existing.published_at is not null then
    raise exception 'Đánh giá đã hiện công khai, không sửa được nữa.' using errcode = 'check_violation';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Chọn từ 1 đến 5 sao.' using errcode = 'check_violation';
  end if;
  if not public.review_tags_ok(p_rating, p_tags) then
    raise exception 'Từ 3 sao trở xuống, chọn ít nhất một điều chưa tốt.' using errcode = 'check_violation';
  end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = b.customer_id;
  select trim(both ' · ' from coalesce(t.name, '') || ' · ' || coalesce(v.label, '')) into label
    from public.service_templates t
    left join public.service_variants v on v.template_id = b.template_id and v.id = b.variant_id
    where t.id = b.template_id;

  insert into public.reviews (booking_id, pro_id, customer_id, author_name, service_label,
                              rating, tags, body, photo_paths, published_at)
  values (p_booking, b.pro_id, b.customer_id, who, coalesce(label, ''),
          p_rating, coalesce(p_tags, '{}'), p_body, coalesce(p_photo_paths, '{}'), null)
  on conflict (booking_id) do update
    set rating = excluded.rating, tags = excluded.tags, body = excluded.body,
        photo_paths = excluded.photo_paths;

  if exists (select 1 from public.customer_reviews where booking_id = p_booking) then
    perform public.publish_reviews_for(p_booking);
  elsif existing is null then
    perform public.notify(b.pro_id, 'review_waiting', 'Khách đã đánh giá bạn',
      'Đánh giá khách để xem. Cả hai hiện cùng lúc, hoặc sau 14 ngày.', '/bookings/' || p_booking);
  end if;
end $$;

-- Same as 20260923101000, with the window and the blind. Still written once.
create or replace function public.review_customer(p_booking uuid, p_rating int, p_body text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá khách sau khi job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  if not public.review_window_open(b) then
    raise exception 'Đã quá 14 ngày kể từ khi hoàn thành, không thể đánh giá nữa.' using errcode = 'check_violation';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Chọn từ 1 đến 5 sao.' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(p_body, '')) > 1000 then
    raise exception 'Nhận xét tối đa 1000 ký tự.' using errcode = 'check_violation';
  end if;
  if p_rating <= 2 and char_length(trim(coalesce(p_body, ''))) < 10 then
    raise exception 'Từ 2 sao trở xuống, cho người làm khác biết lý do (ít nhất 10 ký tự).' using errcode = 'check_violation';
  end if;
  insert into public.customer_reviews (booking_id, pro_id, customer_id, rating, body, published_at)
  values (b.id, b.pro_id, b.customer_id, p_rating, trim(coalesce(p_body, '')), null);
  if exists (select 1 from public.reviews where booking_id = p_booking) then
    perform public.publish_reviews_for(p_booking);
  else
    perform public.notify(b.customer_id, 'review_waiting', 'Người làm đã đánh giá bạn',
      'Đánh giá người làm để xem. Cả hai hiện cùng lúc, hoặc sau 14 ngày.', '/bookings/' || p_booking || '/review');
  end if;
exception when unique_violation then
  raise exception 'Bạn đã đánh giá khách của lịch hẹn này.' using errcode = 'check_violation';
end $$;

-- Once, on a published review, and the customer hears about it.
create or replace function public.reply_review(p_booking uuid, p_reply text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.reviews; v_reply text := trim(coalesce(p_reply, ''));
begin
  select * into r from public.reviews where booking_id = p_booking for update;
  if r is null then raise exception 'Không tìm thấy đánh giá.' using errcode = 'no_data_found'; end if;
  if r.pro_id <> auth.uid() then raise exception 'Không có quyền.' using errcode = 'insufficient_privilege'; end if;
  if r.published_at is null then
    raise exception 'Đánh giá chưa hiện công khai.' using errcode = 'check_violation';
  end if;
  if r.reply is not null then
    raise exception 'Bạn đã trả lời đánh giá này.' using errcode = 'check_violation';
  end if;
  if char_length(v_reply) < 2 then
    raise exception 'Nhập câu trả lời.' using errcode = 'check_violation';
  end if;
  update public.reviews set reply = left(v_reply, 1000), replied_at = now() where booking_id = p_booking;
  perform public.notify(r.customer_id, 'review_reply', 'Người làm đã trả lời đánh giá của bạn', left(v_reply, 120),
    '/pros/' || r.pro_id);
end $$;

-- Hourly: the window closed with only one side written.
create function public.publish_due_reviews() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select b.id from public.bookings b
    where b.completed_at < now() - interval '14 days'
      and (exists (select 1 from public.reviews x where x.booking_id = b.id and x.published_at is null)
        or exists (select 1 from public.customer_reviews x where x.booking_id = b.id and x.published_at is null))
    limit 1000
  loop
    perform public.publish_reviews_for(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

create index if not exists reviews_unpublished_idx on public.reviews (booking_id) where published_at is null;
create index if not exists customer_reviews_unpublished_idx on public.customer_reviews (booking_id) where published_at is null;

-- Ratings: published and not hidden.
create or replace function public.refresh_pro_rating(p_pro uuid) returns void
language sql security definer set search_path = '' as $$
  update public.pros p set
    rating_avg = coalesce(r.avg_rating, 0),
    rating_count = coalesce(r.n, 0)
  from (
    select avg(rating)::numeric(3, 2) as avg_rating, count(*) as n
    from public.reviews where pro_id = p_pro and hidden_at is null and published_at is not null
  ) r
  where p.id = p_pro
$$;

create or replace function public.recompute_pro_metrics() returns void
language sql security definer set search_path = '' as $$
  update public.pros p set
    completed_jobs = coalesce(m.done, 0),
    response_minutes = coalesce(m.response_min, 0),
    rating_avg = coalesce(r.avg_rating, 0),
    rating_count = coalesce(r.n, 0)
  from (
    select pr.id,
      count(*) filter (where b.status = 'completed') as done,
      round(avg(extract(epoch from (b.confirmed_at - b.created_at)) / 60)
            filter (where b.confirmed_at is not null))::int as response_min
    from public.pros pr
    left join public.bookings b on b.pro_id = pr.id
    group by pr.id
  ) m
  left join (
    select pro_id, avg(rating)::numeric(3, 2) as avg_rating, count(*) as n
    from public.reviews where hidden_at is null and published_at is not null group by pro_id
  ) r on r.pro_id = m.id
  where p.id = m.id
$$;

-- Who sees what while a review is still blind: its author, and the admins.
drop policy "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select using (
  (hidden_at is null and published_at is not null)
  or customer_id = (select auth.uid())
  or (pro_id = (select auth.uid()) and published_at is not null)
  or (select public.is_admin())
);

drop policy "customer reviews are for their subject and the pros who meet them" on public.customer_reviews;
create policy "customer reviews are for their subject and the pros who meet them" on public.customer_reviews
  for select using (
    pro_id = (select auth.uid())
    or (select public.is_admin())
    or (published_at is not null and (
      customer_id = (select auth.uid())
      or exists (
        select 1 from public.bookings b
        where b.customer_id = customer_reviews.customer_id and b.pro_id = (select auth.uid())
      )
    ))
  );

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname = 'dep360-publish-reviews';
  perform cron.schedule('dep360-publish-reviews', '40 * * * *', 'select public.publish_due_reviews()');
end $$;

revoke all on function
  public.review_tags_ok(int, text[]),
  public.publish_reviews_for(uuid),
  public.publish_due_reviews(),
  public.review_window_open(public.bookings)
from public, anon, authenticated;
