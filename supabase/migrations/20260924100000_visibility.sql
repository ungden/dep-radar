-- Three reads that showed more than they should, and one write that trusted too much.
--
-- 1. A freelancer's review of a customer was readable by *any* freelancer. That
--    let anyone with a profile look up any customer's history -- a lookup tool
--    for private people. It is for the freelancers who actually meet the person:
--    the ones with a booking with them (any status: a pending booking is exactly
--    when they need to decide), plus the customer and the admins.
-- 2. A suspended freelancer stayed visible. suspended_at stopped new bookings
--    (availability_problem) but the profile, and every one of their posts, still
--    showed to the public. Suspension now takes both off the marketplace; the
--    owner and the admins still see them, and so does a customer with a booking
--    with them -- their own booking history must not lose its other party.
-- 3. The feed counters only rank public posts, so the 30-day totals do too.
-- 4. Anyone may report feed events (most of the audience is not signed in), but
--    "saved" and "tapped book" are the strong signals, and an anonymous script
--    could manufacture them. Only impressions and opens are taken anonymously.

-- 1. Reviews of customers ------------------------------------------------------

drop policy "customer reviews are for pros and their subject" on public.customer_reviews;
create policy "customer reviews are for their subject and the pros who meet them" on public.customer_reviews
  for select using (
    customer_id = (select auth.uid())
    or pro_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.bookings b
      where b.customer_id = customer_reviews.customer_id and b.pro_id = (select auth.uid())
    )
  );

-- 2. Suspended freelancers -------------------------------------------------------

drop policy "published pros are public" on public.pros;
create policy "published pros are public" on public.pros for select using (
  (published and suspended_at is null)
  or id = (select auth.uid())
  or (select public.is_admin())
  -- A customer's bookings join the freelancer for a name. Without this a
  -- suspension would make the customer's own booking vanish from their list.
  or exists (
    select 1 from public.bookings b
    where b.pro_id = pros.id and b.customer_id = (select auth.uid())
  )
);

-- Posts are public exactly when the profile they belong to is, the same rule
-- model_profiles has followed since 20260923100500. An unpublished profile's
-- posts were already left out of every public list by the app; now the database
-- says so too.
drop policy "works are public" on public.works;
create policy "works of listed pros are public" on public.works for select using (
  pro_id = (select auth.uid())
  or (select public.is_admin())
  or exists (
    select 1 from public.pros p
    where p.id = works.pro_id and p.published and p.suspended_at is null
  )
);

-- 3. Feed totals ---------------------------------------------------------------

-- Same as 20260923100700, limited to posts the public can see.
create or replace function public.work_stats_30d()
returns table (work_id uuid, impressions int, opens int, saves int, book_clicks int)
language sql stable security definer set search_path = '' as $$
  select s.work_id,
         sum(s.impressions)::int, sum(s.opens)::int, sum(s.saves)::int, sum(s.book_clicks)::int
  from public.work_stats_daily s
  join public.works w on w.id = s.work_id
  join public.pros p on p.id = w.pro_id
  where s.day > (now() at time zone public.app_timezone())::date - 30
    and p.published and p.suspended_at is null
  group by s.work_id
$$;

-- 4. Feed events ---------------------------------------------------------------

-- Same as 20260923100700, except that 'save' and 'book_click' are only counted
-- from a signed-in caller. The 60-event cap and the once-per-post-per-kind rule
-- stay as they were.
create or replace function public.log_work_events(p_events jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
  signed_in boolean := auth.uid() is not null;
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then return 0; end if;

  with events as (
    select e ->> 'work' as work, e ->> 'kind' as kind
    from jsonb_array_elements(p_events) with ordinality as x (e, pos)
    where x.pos <= 60 and jsonb_typeof(x.e) = 'object'
  ),
  known as (
    select w.id as work_id, e.kind
    from events e join public.works w on w.id = case when e.work ~* uuid_re then e.work::uuid end
    union
    select w.id, e.kind
    from events e join public.works w on w.slug = e.work
    where e.work !~* uuid_re
  ),
  counted as (
    select k.work_id,
           count(*) filter (where k.kind = 'impression')::int as impressions,
           count(*) filter (where k.kind = 'open')::int as opens,
           count(*) filter (where k.kind = 'save')::int as saves,
           count(*) filter (where k.kind = 'book_click')::int as book_clicks
    from known k
    where k.kind in ('impression', 'open')
       -- The strong signals need a person behind them.
       or (signed_in and k.kind in ('save', 'book_click'))
    group by k.work_id
  ),
  written as (
    insert into public.work_stats_daily as s (work_id, day, impressions, opens, saves, book_clicks)
    select c.work_id, (now() at time zone public.app_timezone())::date,
           c.impressions, c.opens, c.saves, c.book_clicks
    from counted c
    on conflict (work_id, day) do update set
      impressions = s.impressions + excluded.impressions,
      opens = s.opens + excluded.opens,
      saves = s.saves + excluded.saves,
      book_clicks = s.book_clicks + excluded.book_clicks
    returning 1
  )
  select count(*) into n from written;
  return n;
end $$;

-- `create or replace` keeps the grants; restate them so a fresh database and the
-- privilege test in rules.sql read the same thing.
revoke all on function public.log_work_events(jsonb), public.work_stats_30d() from public, anon, authenticated;
grant execute on function public.log_work_events(jsonb), public.work_stats_30d() to anon, authenticated;
