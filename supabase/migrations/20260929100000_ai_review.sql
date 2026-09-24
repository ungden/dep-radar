-- Partner profiles are reviewed before customers see them, by an AI, with a log
-- for the staff (owner's decision, 24/09/2026: "AI tự duyệt tự follow up hết đi,
-- nhưng để lại nhật kí để admin kiểm tra").
--
-- 1. A profile has a review state. Pressing "Mở hồ sơ" no longer publishes a
--    profile that was never approved: it asks for a review (pending). The
--    reviewer (lib/ai/review.ts, run by Vercel Cron and right after the press)
--    decides with apply_ai_profile_decision(). Once approved, hiding and showing
--    the profile again is the partner's own switch, as before.
-- 2. A post can be hidden: the reviewer looks at every new post of an approved
--    partner, and hides one that should not be on the marketplace.
-- 3. Every decision, and every reminder the reviewer sends, is a row in
--    ai_decisions. Admins read it at /admin → "Nhật ký AI" and can reverse any
--    decision with admin_override_ai_decision().

-- 1. Review state ----------------------------------------------------------------

alter table public.pros
  add column review_status text not null default 'draft'
    check (review_status in ('draft', 'pending', 'approved', 'changes_requested', 'rejected')),
  -- What to fix, one reason per line; shown to the partner.
  add column review_note text,
  add column review_requested_at timestamptz,
  add column reviewed_at timestamptz;

-- Every profile already on the marketplace was published under the old rules.
update public.pros set review_status = 'approved', reviewed_at = now() where published;

create index pros_review_pending_idx on public.pros (review_requested_at) where review_status = 'pending';

-- 2. Hidden posts ----------------------------------------------------------------

alter table public.works
  add column hidden_at timestamptz,
  add column hidden_reason text,
  -- 'ai' or 'admin': a post the staff hid stays hidden whatever the reviewer says later.
  add column hidden_by text check (hidden_by in ('ai', 'admin')),
  -- Null until the reviewer has looked at the post; editing its photos clears it.
  add column ai_checked_at timestamptz;

-- The posts already public predate the reviewer; it starts with the next ones.
-- Setting ai_checked_at back to null puts a post in its queue.
update public.works set ai_checked_at = now();

create index works_ai_queue_idx on public.works (created_at) where ai_checked_at is null;

-- The platform's columns on a post are not the owner's to write. Row level
-- security lets them edit their own posts, so this is where the line is drawn.
create function public.guard_work_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_privileged() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.hidden_at := null;
    new.hidden_reason := null;
    new.hidden_by := null;
    new.ai_checked_at := null;
  else
    new.hidden_at := old.hidden_at;
    new.hidden_reason := old.hidden_reason;
    new.hidden_by := old.hidden_by;
    -- New photos are a new post as far as the reviewer is concerned.
    new.ai_checked_at := case
      when new.image_paths is distinct from old.image_paths or new.video_path is distinct from old.video_path then null
      else old.ai_checked_at
    end;
  end if;
  return new;
end $$;

create trigger works_write_guard
  before insert or update on public.works
  for each row execute function public.guard_work_write();

-- Same as 20260924100000, minus hidden posts. The owner and the admins still see them.
drop policy "works of listed pros are public" on public.works;
create policy "works of listed pros are public" on public.works for select using (
  pro_id = (select auth.uid())
  or (select public.is_admin())
  or (
    works.hidden_at is null
    and exists (
      select 1 from public.pros p
      where p.id = works.pro_id and p.published and p.suspended_at is null
    )
  )
);

-- Same as 20260924100000, minus hidden posts.
create or replace function public.work_stats_30d()
returns table (work_id uuid, impressions int, opens int, saves int, book_clicks int)
language sql stable security definer set search_path = '' as $$
  select s.work_id,
         sum(s.impressions)::int, sum(s.opens)::int, sum(s.saves)::int, sum(s.book_clicks)::int
  from public.work_stats_daily s
  join public.works w on w.id = s.work_id
  join public.pros p on p.id = w.pro_id
  where s.day > (now() at time zone public.app_timezone())::date - 30
    and p.published and p.suspended_at is null and w.hidden_at is null
  group by s.work_id
$$;

-- 3. The guard -----------------------------------------------------------------

-- guard_pro_update as in 20260926100000, plus:
--  * the review columns are the platform's (like the badge and the rating);
--  * a partner turning published on before they were ever approved asks for a
--    review instead: the profile stays hidden and goes to 'pending'. No error,
--    the screen says "Đang chờ duyệt". The completeness check still comes first;
--  * a post has to be visible to count as the one post a profile needs;
--  * a privileged caller (admin, service role) publishing a profile approves it,
--    unless it set review_status itself.
-- Edits to the bio, title, name or categories of an approved profile keep it
-- approved: posts are reviewed on their own, and the log shows what changed.
create or replace function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
  system boolean := coalesce(current_setting('app.system_write', true), '') = 'on';
begin
  -- delete_my_account() writes the tombstone itself; nothing below applies to it.
  if deleting or system then
    return new;
  end if;
  if not public.is_privileged() then
    new.identity_status := old.identity_status;
    new.identity_name := old.identity_name;
    new.adult := old.adult;
    new.birth_year := old.birth_year;
    new.suspended_at := old.suspended_at;
    new.completed_jobs := old.completed_jobs;
    new.response_minutes := old.response_minutes;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.slug := old.slug;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
    new.review_requested_at := old.review_requested_at;
    new.reviewed_at := old.reviewed_at;
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id and k.hidden_at is null) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
      if old.review_status <> 'approved' then
        new.published := false;
        new.review_status := 'pending';
        new.review_requested_at := now();
      end if;
    end if;
    if new.accepting_jobs and not old.accepting_jobs and public.wallet_below_floor(new.id) then
      raise exception 'Thanh toán phí của đơn trước để nhận lịch mới.' using errcode = 'check_violation';
    end if;
  elsif new.published and not old.published
        and new.review_status is not distinct from old.review_status and old.review_status <> 'approved' then
    new.review_status := 'approved';
    new.reviewed_at := coalesce(new.reviewed_at, now());
  end if;
  -- A verified freelancer is shown under the name on their ID card.
  if coalesce(new.identity_name, '') <> '' and new.identity_status = 'verified' then
    new.display_name := new.identity_name;
  end if;
  if coalesce(new.display_name, '') = '' then
    new.display_name := old.display_name;
  end if;
  return new;
end $$;

-- Same as 20260924100100, plus: a new profile starts as a draft, whatever the
-- insert said. (Inserting 'approved' and then publishing would skip the review.)
create or replace function public.guard_pro_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.identity_status := 'none';
  new.identity_name := null;
  new.adult := null;
  new.birth_year := null;
  new.suspended_at := null;
  new.completed_jobs := 0;
  new.response_minutes := 0;
  new.rating_avg := 0;
  new.rating_count := 0;
  new.published := false;
  new.review_status := 'draft';
  new.review_note := null;
  new.review_requested_at := null;
  new.reviewed_at := null;
  if coalesce(new.display_name, '') = '' then
    select coalesce(nullif(full_name, ''), 'Chuyên viên') into new.display_name
      from public.accounts where id = new.id;
  end if;
  return new;
end $$;

-- 4. The log ---------------------------------------------------------------------

create table public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text not null check (subject in ('pro_profile', 'work', 'follow_up')),
  pro_id uuid not null references public.pros (id) on delete cascade,
  work_id uuid references public.works (id) on delete set null,
  decision text not null
    check (decision in ('approved', 'changes_requested', 'rejected', 'hidden', 'kept', 'nudged', 'skipped')),
  -- Vietnamese, specific; what the partner was told.
  reasons text[] not null default '{}',
  -- Vietnamese, one or two sentences for the staff.
  summary text not null default '',
  -- 'gemini-…', or 'rules' when no AI was asked.
  model text not null default 'rules',
  -- What was looked at: counts, prices, a bio excerpt, photo URLs. Never ID data.
  input jsonb not null default '{}',
  overridden_by uuid references public.accounts (id) on delete set null,
  overridden_at timestamptz,
  override_decision text
    check (override_decision in ('approved', 'changes_requested', 'rejected', 'hidden', 'kept')),
  override_note text
);

create index ai_decisions_created_idx on public.ai_decisions (created_at desc);
create index ai_decisions_pro_idx on public.ai_decisions (pro_id, subject, created_at desc);
create index ai_decisions_work_idx on public.ai_decisions (work_id) where work_id is not null;

alter table public.ai_decisions enable row level security;
-- Admins read it; nobody writes it except the functions below.
create policy "admins read the AI log" on public.ai_decisions for select using ((select public.is_admin()));
revoke all on public.ai_decisions from anon, authenticated;
grant select on public.ai_decisions to authenticated;

-- 5. Applying decisions ----------------------------------------------------------

-- The reviewer's decision on a profile waiting for review. Returns the log row,
-- or null when the profile is no longer waiting (the partner hid it again, an
-- admin decided first, or another run already did): then nothing is written.
-- 'skipped' is logged without touching the profile (the AI could not answer).
create function public.apply_ai_profile_decision(
  p_pro uuid, p_decision text, p_reasons text[], p_summary text, p_model text, p_input jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  p public.pros;
  log_id uuid;
  reasons text[] := coalesce(array_remove(p_reasons, ''), '{}');
  note text;
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if p_decision not in ('approved', 'changes_requested', 'rejected', 'skipped') then
    raise exception 'Quyết định không hợp lệ: %', p_decision using errcode = 'check_violation';
  end if;
  if p_decision in ('changes_requested', 'rejected') and cardinality(reasons) = 0 then
    raise exception 'Cần nêu lý do.' using errcode = 'check_violation';
  end if;
  select * into p from public.pros where id = p_pro for update;
  if p.id is null or p.review_status <> 'pending' then
    return null;
  end if;

  insert into public.ai_decisions (subject, pro_id, decision, reasons, summary, model, input)
  values ('pro_profile', p_pro, p_decision, reasons, coalesce(p_summary, ''), coalesce(nullif(p_model, ''), 'rules'),
          coalesce(p_input, '{}'))
  returning id into log_id;
  if p_decision = 'skipped' then
    return log_id;
  end if;

  note := array_to_string(reasons, E'\n');
  perform set_config('app.system_write', 'on', true);
  if p_decision = 'approved' then
    update public.pros set published = true, review_status = 'approved', review_note = null, reviewed_at = now()
    where id = p_pro;
    -- The posts the reviewer looked at are checked; the rest wait in its queue.
    update public.works set ai_checked_at = now()
    where pro_id = p_pro and ai_checked_at is null
      and id in (select x::uuid from jsonb_array_elements_text(coalesce(p_input -> 'work_ids', '[]')) x where x ~* uuid_re);
    perform public.notify(p_pro, 'profile_approved', 'Hồ sơ đã được duyệt',
      'Khách đã thấy hồ sơ của bạn và đặt lịch được rồi.', '/studio');
  else
    update public.pros set published = false, review_status = p_decision, review_note = note, reviewed_at = now()
    where id = p_pro;
    perform public.notify(p_pro, 'profile_review',
      case when p_decision = 'rejected' then 'Hồ sơ chưa được duyệt: ' else 'Hồ sơ cần chỉnh: ' end || left(reasons[1], 80),
      note || E'\nSửa xong bấm "Gửi duyệt lại".', '/studio/profile/edit');
  end if;
  perform set_config('app.system_write', '', true);
  return log_id;
end $$;

-- The reviewer's decision on one post. 'kept' marks it checked (and shows it
-- again if the reviewer had hidden an earlier version of its photos); 'hidden'
-- takes it off the marketplace and tells the owner why. Always logged.
create function public.apply_ai_work_decision(
  p_work uuid, p_decision text, p_reasons text[], p_summary text, p_model text, p_input jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  w public.works;
  log_id uuid;
  reasons text[] := coalesce(array_remove(p_reasons, ''), '{}');
begin
  if p_decision not in ('kept', 'hidden') then
    raise exception 'Quyết định không hợp lệ: %', p_decision using errcode = 'check_violation';
  end if;
  if p_decision = 'hidden' and cardinality(reasons) = 0 then
    raise exception 'Cần nêu lý do.' using errcode = 'check_violation';
  end if;
  select * into w from public.works where id = p_work for update;
  if w.id is null then
    return null;
  end if;

  insert into public.ai_decisions (subject, pro_id, work_id, decision, reasons, summary, model, input)
  values ('work', w.pro_id, w.id, p_decision, reasons, coalesce(p_summary, ''), coalesce(nullif(p_model, ''), 'rules'),
          coalesce(p_input, '{}'))
  returning id into log_id;

  if p_decision = 'kept' then
    update public.works set ai_checked_at = now(),
      hidden_at = case when hidden_by = 'ai' then null else hidden_at end,
      hidden_reason = case when hidden_by = 'ai' then null else hidden_reason end,
      hidden_by = case when hidden_by = 'ai' then null else hidden_by end
    where id = w.id;
  else
    update public.works set ai_checked_at = now(), hidden_at = now(), hidden_by = 'ai',
      hidden_reason = array_to_string(reasons, E'\n')
    where id = w.id;
    perform public.notify(w.pro_id, 'work_hidden', 'Một bài đăng đã bị ẩn: ' || left(w.title, 60),
      array_to_string(reasons, E'\n') || E'\nBạn có thể xoá bài này và đăng ảnh khác.', '/studio/works');
  end if;
  return log_id;
end $$;

-- A reminder the reviewer sent, logged, and the notification itself (which the
-- push trigger takes to the phone). input.kind says which kind: 'setup',
-- 'changes' or 'fee'; the schedule counts earlier ones by it.
create function public.log_ai_followup(
  p_pro uuid, p_summary text, p_reasons text[], p_input jsonb,
  p_title text default null, p_body text default null, p_link text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare log_id uuid;
begin
  insert into public.ai_decisions (subject, pro_id, decision, reasons, summary, model, input)
  values ('follow_up', p_pro, 'nudged', coalesce(p_reasons, '{}'), coalesce(p_summary, ''), 'rules', coalesce(p_input, '{}'))
  returning id into log_id;
  if coalesce(p_title, '') <> '' then
    perform public.notify(p_pro, 'ai_follow_up', p_title, coalesce(p_body, ''), p_link);
  end if;
  return log_id;
end $$;

-- What the reminder schedule (lib/ai/followups.ts) decides from, one row per
-- partner and kind of reminder that might be due:
--  * setup: never asked for a review, profile older than a day;
--  * changes: asked to change something more than two days ago, not resubmitted;
--  * fee: owing (wallet below zero) for more than a day. `since` is when the
--    balance last went below zero.
-- `prior` and `last_at` count the reminders of that kind already sent (for
-- 'changes', since the decision they are about).
create function public.ai_followup_facts(p_limit int default 200)
returns table (
  pro_id uuid, kind text, created_at timestamptz, since timestamptz,
  has_service boolean, has_hours boolean, has_work boolean,
  balance int, prior int, last_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  with ledger as (
    select e.id, e.pro_id, e.created_at,
           sum(e.amount) over (partition by e.pro_id order by e.created_at, e.id) as running
    from public.wallet_entries e
  ),
  owing as (
    -- The first entry below zero after the last time the balance was not.
    select l.pro_id, min(l.created_at) as since
    from ledger l
    where l.running < 0
      and not exists (
        select 1 from ledger k
        where k.pro_id = l.pro_id and k.running >= 0 and (k.created_at, k.id) > (l.created_at, l.id)
      )
    group by l.pro_id
  ),
  candidates as (
    select p.id as pro_id, 'setup'::text as kind, p.created_at, p.created_at as since
    from public.pros p
    where p.review_status = 'draft' and p.review_requested_at is null and not p.published
      and p.suspended_at is null and p.created_at < now() - interval '1 day'
    union all
    select p.id, 'changes', p.created_at, p.reviewed_at
    from public.pros p
    where p.review_status = 'changes_requested' and p.reviewed_at < now() - interval '2 days'
      and p.suspended_at is null
    union all
    select p.id, 'fee', p.created_at, o.since
    from owing o join public.pros p on p.id = o.pro_id
    where o.since < now() - interval '1 day' and p.suspended_at is null
  )
  select c.pro_id, c.kind, c.created_at, c.since,
         exists (select 1 from public.pro_services s where s.pro_id = c.pro_id and s.active),
         exists (select 1 from public.working_hours h where h.pro_id = c.pro_id),
         exists (select 1 from public.works k where k.pro_id = c.pro_id and k.hidden_at is null),
         public.wallet_balance(c.pro_id),
         n.prior, n.last_at
  from candidates c
  cross join lateral (
    select count(*)::int as prior, max(d.created_at) as last_at
    from public.ai_decisions d
    where d.pro_id = c.pro_id and d.subject = 'follow_up' and d.input ->> 'kind' = c.kind
      and (c.kind <> 'changes' or d.created_at > c.since)
  ) n
  order by c.since
  limit greatest(coalesce(p_limit, 200), 0)
$$;

-- An admin reverses (or re-reverses) a decision in the log. The row keeps what
-- the AI said; the override is written next to it, applied, and the partner is
-- told. Profiles: approved / changes_requested / rejected. Posts: hidden / kept.
create function public.admin_override_ai_decision(p_decision_id uuid, p_decision text, p_note text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare
  d public.ai_decisions;
  w public.works;
  note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  select * into d from public.ai_decisions where id = p_decision_id for update;
  if d.id is null then
    raise exception 'Không tìm thấy quyết định.' using errcode = 'no_data_found';
  end if;
  if d.subject = 'follow_up' then
    raise exception 'Lời nhắc không có gì để đảo.' using errcode = 'check_violation';
  end if;
  if (d.subject = 'pro_profile' and p_decision not in ('approved', 'changes_requested', 'rejected'))
     or (d.subject = 'work' and p_decision not in ('hidden', 'kept')) then
    raise exception 'Quyết định không hợp lệ: %', p_decision using errcode = 'check_violation';
  end if;
  if p_decision = coalesce(d.override_decision, d.decision) then
    raise exception 'Quyết định này đã như vậy rồi.' using errcode = 'check_violation';
  end if;

  update public.ai_decisions set overridden_by = auth.uid(), overridden_at = now(),
    override_decision = p_decision, override_note = note
  where id = d.id;

  perform set_config('app.system_write', 'on', true);
  if d.subject = 'pro_profile' then
    if p_decision = 'approved' then
      update public.pros set published = true, review_status = 'approved', review_note = null, reviewed_at = now()
      where id = d.pro_id;
      perform public.notify(d.pro_id, 'profile_approved', 'Hồ sơ đã được duyệt',
        'Nhân viên 360dep đã xem lại và duyệt hồ sơ của bạn. Khách đặt lịch được rồi.', '/studio');
    else
      update public.pros set published = false, review_status = p_decision,
        review_note = coalesce(note, 'Nhân viên 360dep đã xem lại hồ sơ của bạn.'), reviewed_at = now()
      where id = d.pro_id;
      perform public.notify(d.pro_id, 'profile_review',
        case when p_decision = 'rejected' then 'Hồ sơ chưa được duyệt' else 'Hồ sơ cần chỉnh' end,
        coalesce(note, 'Nhân viên 360dep đã xem lại hồ sơ của bạn.') || E'\nSửa xong bấm "Gửi duyệt lại".',
        '/studio/profile/edit');
    end if;
  else
    select * into w from public.works where id = d.work_id;
    if w.id is null then
      raise exception 'Bài đăng này đã bị xoá.' using errcode = 'no_data_found';
    end if;
    if p_decision = 'kept' then
      update public.works set hidden_at = null, hidden_reason = null, hidden_by = null, ai_checked_at = now()
      where id = w.id;
      perform public.notify(w.pro_id, 'work_shown', 'Bài đăng đã hiện lại: ' || left(w.title, 60),
        'Nhân viên 360dep đã xem lại và cho hiện bài đăng này.', '/studio/works');
    else
      update public.works set hidden_at = now(), hidden_by = 'admin', ai_checked_at = now(),
        hidden_reason = coalesce(note, 'Ảnh chưa phù hợp với quy định của 360dep.')
      where id = w.id;
      perform public.notify(w.pro_id, 'work_hidden', 'Một bài đăng đã bị ẩn: ' || left(w.title, 60),
        coalesce(note, 'Ảnh chưa phù hợp với quy định của 360dep.'), '/studio/works');
    end if;
  end if;
  perform set_config('app.system_write', '', true);
end $$;

-- 6. Leaving ---------------------------------------------------------------------

-- The log holds a bio excerpt and photo links: it goes with the account, like
-- the identity checks. Patched into delete_my_account() as it stands.
do $$
declare def text; fixed text;
begin
  select pg_get_functiondef('public.delete_my_account()'::regprocedure) into def;
  fixed := replace(def, 'delete from public.identity_checks where pro_id = me;',
    'delete from public.identity_checks where pro_id = me;' || E'\n  delete from public.ai_decisions where pro_id = me;');
  if fixed = def then
    raise exception 'delete_my_account() changed shape; add the ai_decisions cleanup by hand';
  end if;
  execute fixed;
end $$;

-- 7. Privileges --------------------------------------------------------------------

revoke all on function
  public.guard_pro_insert(),
  public.guard_pro_update(),
  public.guard_work_write(),
  public.apply_ai_profile_decision(uuid, text, text[], text, text, jsonb),
  public.apply_ai_work_decision(uuid, text, text[], text, text, jsonb),
  public.log_ai_followup(uuid, text, text[], jsonb, text, text, text),
  public.ai_followup_facts(int),
  public.admin_override_ai_decision(uuid, text, text),
  public.work_stats_30d()
from public, anon, authenticated;
grant execute on function
  public.apply_ai_profile_decision(uuid, text, text[], text, text, jsonb),
  public.apply_ai_work_decision(uuid, text, text[], text, text, jsonb),
  public.log_ai_followup(uuid, text, text[], jsonb, text, text, text),
  public.ai_followup_facts(int)
to service_role;
-- Checks is_admin() itself.
grant execute on function public.admin_override_ai_decision(uuid, text, text) to authenticated;
-- As in 20260924100000.
grant execute on function public.work_stats_30d() to anon, authenticated;
