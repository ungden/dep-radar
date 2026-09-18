-- Scheduled maintenance. These are what turn the promises on /chinh-sach into
-- behaviour: a booking nobody accepts really does expire, reminders really are sent,
-- and a freelancer's job count is a fact rather than a number someone typed.

-- A pending booking the freelancer never accepted releases the slot.
create function public.expire_stale_bookings() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with expired as (
    update public.bookings
      set status = 'expired', cancelled_at = now(),
          cancel_reason = 'Chuyên viên không xác nhận trong thời gian quy định'
      where status = 'pending' and confirm_by < now()
      returning id, customer_id, pro_id
  )
  select count(*) into n from expired;

  insert into public.notifications (account_id, kind, title, body, link)
  select b.customer_id, 'booking_expired', 'Lịch hẹn đã hết hạn chờ',
         'Chuyên viên không xác nhận kịp. Bạn có thể chọn chuyên viên khác.', '/bookings/' || b.id
  from public.bookings b
  where b.status = 'expired' and b.cancelled_at > now() - interval '1 minute';

  return n;
end $$;

create function public.expire_stale_jobs() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with done as (
    update public.jobs set status = 'expired'
      where status = 'open' and starts_at < now()
      returning id
  )
  select count(*) into n from done;
  update public.offers set status = 'rejected'
    where status = 'pending' and (expires_at < now()
      or job_id in (select id from public.jobs where status <> 'open'));
  return n;
end $$;

-- T-24h and T-2h reminders, one of each per booking.
create function public.send_booking_reminders() returns int
language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  with due as (
    select b.id, b.customer_id, b.pro_id, b.starts_at,
           case when b.starts_at - now() between interval '23 hours' and interval '25 hours'
                then 'reminder_24h' else 'reminder_2h' end as kind
    from public.bookings b
    where b.status = 'confirmed'
      and (b.starts_at - now() between interval '23 hours' and interval '25 hours'
        or b.starts_at - now() between interval '105 minutes' and interval '135 minutes')
  ),
  fresh as (
    select d.* from due d
    where not exists (
      select 1 from public.notifications x
      where x.account_id = d.customer_id and x.kind = d.kind and x.link = '/bookings/' || d.id
    )
  ),
  sent as (
    insert into public.notifications (account_id, kind, title, body, link)
    select f.customer_id, f.kind, 'Nhắc lịch hẹn',
           to_char(f.starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM'), '/bookings/' || f.id
    from fresh f
    union all
    select f.pro_id, f.kind, 'Nhắc job',
           to_char(f.starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM'), '/studio/schedule'
    from fresh f
    returning 1
  )
  select count(*) into n from sent;
  return n;
end $$;

-- Nightly: the numbers on a profile are recomputed from what actually happened.
create function public.recompute_pro_metrics() returns void
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
    from public.reviews where hidden_at is null group by pro_id
  ) r on r.pro_id = m.id
  where p.id = m.id
$$;

-- A freelancer whose prepaid wallet runs too far below zero stops receiving jobs.
create function public.enforce_wallet_threshold(p_limit int default -200000) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with stopped as (
    update public.pros p set accepting_jobs = false
    where p.accepting_jobs and public.wallet_balance(p.id) < p_limit
    returning p.id
  )
  select count(*) into n from stopped;

  insert into public.notifications (account_id, kind, title, body, link)
  select p.id, 'wallet_low', 'Ví đã âm quá hạn mức',
         'Nạp ví để tiếp tục nhận job mới.', '/studio/wallet'
  from public.pros p
  where not p.accepting_jobs and public.wallet_balance(p.id) < p_limit
    and not exists (
      select 1 from public.notifications x
      where x.account_id = p.id and x.kind = 'wallet_low' and x.created_at > now() - interval '1 day'
    );
  return n;
end $$;

revoke execute on function
  public.expire_stale_bookings(),
  public.expire_stale_jobs(),
  public.send_booking_reminders(),
  public.recompute_pro_metrics(),
  public.enforce_wallet_threshold(int)
from authenticated, anon;
