-- How much interest a post earns, so the feed can rank by more than recency.
--
-- Counts only, per post per day: never who looked. The browser reports what was
-- shown and tapped in batches; nobody writes the table directly, and anybody may
-- read the 30-day totals because they are what orders a public feed.
--
-- Anonymous visitors report too (most of the feed's audience is not signed in),
-- which means anyone can call this. Two things keep a script from simply buying
-- a rank: a call counts each post at most once per kind, however many times it
-- is listed, and a call is capped at 60 events. The ranking itself only trusts
-- ratios once a post has a couple of hundred impressions.

create table public.work_stats_daily (
  work_id uuid not null references public.works (id) on delete cascade,
  day date not null,
  impressions int not null default 0 check (impressions >= 0),
  opens int not null default 0 check (opens >= 0),
  saves int not null default 0 check (saves >= 0),
  book_clicks int not null default 0 check (book_clicks >= 0),
  primary key (work_id, day)
);

create index work_stats_daily_day_idx on public.work_stats_daily (day);

alter table public.work_stats_daily enable row level security;
-- No policies: read through work_stats_30d(), written through log_work_events().
revoke all on public.work_stats_daily from anon, authenticated;
grant all on public.work_stats_daily to service_role;

-- p_events: [{"work": "<work id or slug>", "kind": "impression|open|save|book_click"}, ...]
-- Unknown posts and kinds are skipped rather than failing the batch: this is
-- called in the background and nobody is waiting on an error.
create function public.log_work_events(p_events jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then return 0; end if;

  with events as (
    select e ->> 'work' as work, e ->> 'kind' as kind
    from jsonb_array_elements(p_events) with ordinality as x (e, pos)
    where x.pos <= 60 and jsonb_typeof(x.e) = 'object'
  ),
  known as (
    -- By id when the client has it, by slug otherwise. Two joins rather than an
    -- OR, so each side uses its index.
    -- The cast sits behind the test: Postgres does not promise to filter first.
    select w.id as work_id, e.kind
    from events e join public.works w on w.id = case when e.work ~* uuid_re then e.work::uuid end
    union
    select w.id, e.kind
    from events e join public.works w on w.slug = e.work
    where e.work !~* uuid_re
  ),
  counted as (
    -- `union` above already made each (post, kind) pair count once per call.
    select k.work_id,
           count(*) filter (where k.kind = 'impression')::int as impressions,
           count(*) filter (where k.kind = 'open')::int as opens,
           count(*) filter (where k.kind = 'save')::int as saves,
           count(*) filter (where k.kind = 'book_click')::int as book_clicks
    from known k
    where k.kind in ('impression', 'open', 'save', 'book_click')
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

-- Totals over the last 30 local days, today included. Posts with no events are
-- simply absent.
create function public.work_stats_30d()
returns table (work_id uuid, impressions int, opens int, saves int, book_clicks int)
language sql stable security definer set search_path = '' as $$
  select s.work_id,
         sum(s.impressions)::int, sum(s.opens)::int, sum(s.saves)::int, sum(s.book_clicks)::int
  from public.work_stats_daily s
  where s.day > (now() at time zone public.app_timezone())::date - 30
  group by s.work_id
$$;

revoke all on function public.log_work_events(jsonb), public.work_stats_30d() from public, anon, authenticated;
grant execute on function public.log_work_events(jsonb), public.work_stats_30d() to anon, authenticated;
