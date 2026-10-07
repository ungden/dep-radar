-- The help assistant (/tro-giup): every question and the answer it got, so
-- the staff see what people ask that the help centre does not cover yet, and
-- can fix the FAQ (lib/help/knowledge.ts) instead of guessing.
--
-- Written only by the server (service role, app/api/help/*); read only by
-- admins. Phone numbers and e-mail addresses are masked before they are
-- stored, and rows go after 180 days.

create table public.help_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  account_id uuid references public.accounts (id) on delete set null,
  audience text not null check (audience in ('khach', 'doi-tac')),
  question text not null check (char_length(question) between 1 and 500),
  answer text not null,
  -- FAQ entries the answer was built from (lib/help/knowledge.ts ids).
  sources text[] not null default '{}',
  -- false: the help centre does not cover this question; worth an FAQ entry.
  covered boolean not null,
  -- The assistant sent the person to the support team.
  handoff boolean not null default false,
  model text not null,
  -- The person's thumbs up / down, once.
  helpful boolean
);

create index help_questions_created_idx on public.help_questions (created_at desc);
create index help_questions_uncovered_idx on public.help_questions (created_at desc) where not covered;

alter table public.help_questions enable row level security;
create policy "admins read help questions" on public.help_questions for select using ((select public.is_admin()));
revoke all on public.help_questions from anon, authenticated;
grant select on public.help_questions to authenticated;

-- Personal data does not stay longer than it is useful: daily, 03:30 in Vietnam.
create function public.purge_help_questions() returns void
language sql security definer set search_path = '' as $$
  delete from public.help_questions where created_at < now() - interval '180 days'
$$;
revoke all on function public.purge_help_questions() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname = 'dep360-help-retention';
  perform cron.schedule('dep360-help-retention', '30 20 * * *', 'select public.purge_help_questions()');
end $$;
