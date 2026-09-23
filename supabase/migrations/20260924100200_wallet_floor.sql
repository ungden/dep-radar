-- A wallet past its overdraft limit stops new jobs, and stays stopped.
--
-- Until now the limit was only a cron job: enforce_wallet_threshold() switched
-- accepting_jobs off once an hour, and the freelancer could switch it straight
-- back on and keep taking jobs on credit. The limit is now a fact the database
-- checks at the two moments that matter:
--  * availability_problem() refuses a new booking (20260924100400);
--  * the profile guard below refuses switching accepting_jobs back on.
--
-- The limit itself moves into fee_policy, next to the other numbers the
-- platform sets, so the cron, the booking check and the guard cannot disagree.

alter table public.fee_policy
  add column wallet_floor int not null default -200000 check (wallet_floor <= 0);

-- True when the freelancer's prepaid wallet is below the platform's limit.
-- Internal: the guard and availability_problem() ask, nobody else.
create function public.wallet_below_floor(p_pro uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.wallet_balance(p_pro) < (select f.wallet_floor from public.fee_policy f where f.id)
$$;

-- Same as 20260918040500, but the limit defaults to fee_policy.wallet_floor
-- instead of a number written into the function. Passing one still works.
create or replace function public.enforce_wallet_threshold(p_limit int default null) returns int
language plpgsql security definer set search_path = '' as $$
declare n int; v_limit int;
begin
  select coalesce(p_limit, f.wallet_floor) into v_limit from public.fee_policy f where f.id;
  with stopped as (
    update public.pros p set accepting_jobs = false
    where p.accepting_jobs and public.wallet_balance(p.id) < v_limit
    returning p.id
  )
  select count(*) into n from stopped;

  insert into public.notifications (account_id, kind, title, body, link)
  select p.id, 'wallet_low', 'Ví đã âm quá hạn mức',
         'Nạp ví để tiếp tục nhận job mới.', '/studio/wallet'
  from public.pros p
  where not p.accepting_jobs and public.wallet_balance(p.id) < v_limit
    and not exists (
      select 1 from public.notifications x
      where x.account_id = p.id and x.kind = 'wallet_low' and x.created_at > now() - interval '1 day'
    );
  return n;
end $$;

-- Same as 20260922092824, plus:
--  * adult and birth_year are the platform's, like identity_status;
--  * accepting_jobs cannot be switched back on while the wallet is past its
--    limit. Switching it off is always allowed.
create or replace function public.guard_pro_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare deleting boolean := coalesce(current_setting('app.deleting_account', true), '') = old.id::text;
begin
  -- delete_my_account() writes the tombstone itself; nothing below applies to it.
  if deleting then
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
    if new.published and not old.published then
      if not exists (select 1 from public.pro_services s where s.pro_id = new.id and s.active)
         or not exists (select 1 from public.working_hours w where w.pro_id = new.id)
         or not exists (select 1 from public.works k where k.pro_id = new.id) then
        raise exception 'Cần ít nhất 1 dịch vụ, giờ làm việc và 1 ảnh tác phẩm trước khi mở hồ sơ.'
          using errcode = 'check_violation';
      end if;
    end if;
    if new.accepting_jobs and not old.accepting_jobs and public.wallet_below_floor(new.id) then
      raise exception 'Ví đang âm quá hạn mức, nạp ví để nhận lịch lại.' using errcode = 'check_violation';
    end if;
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

revoke all on function
  public.wallet_below_floor(uuid),
  public.enforce_wallet_threshold(int),
  public.guard_pro_update()
from public, anon, authenticated;
