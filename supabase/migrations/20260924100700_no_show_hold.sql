-- A no-show report pays the freelancer's travel, after the customer has had a
-- day to say it is not true.
--
-- Since 20260919111530 a no-show only filed a claim, and the travel fee reached
-- the wallet when an admin approved it -- which nobody was doing, so honest
-- freelancers were never paid. Paying at once would be worse: marking a customer
-- absent is one tap, costs the freelancer nothing, and earns money.
--
-- So the credit is held:
--  * mark_no_show() files the claim with release_at = now() + 24 hours, and the
--    customer is told they have those 24 hours to dispute it;
--  * dispute_no_show() lets the customer do that: it files a report for the
--    admins, tells them, and stops the automatic release;
--  * release_no_show_credits(), every fifteen minutes, pays every claim whose
--    24 hours passed without a dispute;
--  * a disputed claim waits for an admin, through decide_no_show_compensation()
--    as before, which now also closes the dispute's report.
--
-- Claims filed before this change have no release_at and stay with the admins:
-- their customers were never offered the 24 hours.

alter table public.no_show_compensation_requests
  add column release_at timestamptz,
  add column disputed_at timestamptz,
  add column dispute_report_id uuid references public.reports (id) on delete set null;

create index no_show_compensation_requests_release_idx on public.no_show_compensation_requests (release_at)
  where status = 'pending' and disputed_at is null;

-- Same as 20260919111530, with the hold and the customer told how to object.
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
    insert into public.no_show_compensation_requests (booking_id, pro_id, amount, reason, release_at)
    values (b.id, b.pro_id, b.travel_fee, left(coalesce(p_reason, ''), 300), now() + interval '24 hours')
    on conflict (booking_id) do nothing;
  end if;
  perform public.notify(b.customer_id, 'booking_no_show', 'Chuyên viên báo bạn không có mặt',
    'Nếu có nhầm lẫn, hãy khiếu nại trong 24 giờ trên trang lịch hẹn.', '/bookings/' || p_booking);
end $$;

-- The customer's side of a no-show. Returns the report id.
create function public.dispute_no_show(p_booking uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; v_reason text := trim(coalesce(p_reason, '')); report_id uuid; held int;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'no_show' then
    raise exception 'Chỉ khiếu nại được lịch hẹn bị báo vắng mặt.' using errcode = 'check_violation';
  end if;
  -- cancelled_at is the moment the freelancer marked it.
  if now() > b.cancelled_at + interval '24 hours' then
    raise exception 'Đã quá 24 giờ kể từ khi bị báo vắng mặt. Liên hệ hỗ trợ nếu cần.' using errcode = 'check_violation';
  end if;
  if char_length(v_reason) < 10 then
    raise exception 'Cho 360dep biết chuyện gì đã xảy ra (ít nhất 10 ký tự).' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.reports r
    where r.booking_id = b.id and r.reporter_id = b.customer_id and r.reason = 'no_show_dispute'
  ) then
    raise exception 'Bạn đã khiếu nại lịch hẹn này rồi.' using errcode = 'check_violation';
  end if;

  insert into public.reports (reporter_id, target_account_id, booking_id, reason, detail)
  values (b.customer_id, b.pro_id, b.id, 'no_show_dispute', left(v_reason, 1000))
  returning id into report_id;

  -- Not paid until someone has looked. Nothing to hold when there was no travel fee.
  update public.no_show_compensation_requests
    set disputed_at = now(), dispute_report_id = report_id
    where booking_id = b.id and status = 'pending';
  get diagnostics held = row_count;

  insert into public.notifications (account_id, kind, title, body, link)
  select a.id, 'no_show_disputed', 'Khách khiếu nại báo vắng mặt', left(v_reason, 200), '/admin'
  from public.accounts a
  where a.is_admin;

  perform public.notify(b.pro_id, 'no_show_disputed', 'Khách khiếu nại việc báo vắng mặt',
    case when held > 0 then 'Khoản bù phí di chuyển được giữ lại tới khi 360dep xem xét xong.'
         else '360dep sẽ xem xét và liên hệ nếu cần thêm thông tin.' end,
    '/bookings/' || b.id);
  return report_id;
end $$;

-- Pays every held claim whose 24 hours passed without a dispute.
create function public.release_no_show_credits() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with released as (
    update public.no_show_compensation_requests c
      set status = 'approved', decided_at = now(),
          decision_note = 'Tự động: khách không khiếu nại trong 24 giờ.'
      where c.status = 'pending' and c.disputed_at is null and c.release_at <= now()
      returning c.pro_id, c.booking_id, c.amount
  ),
  credited as (
    insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
    select r.pro_id, r.booking_id, 'no_show_comp', r.amount, 'Bù phí di chuyển khi khách vắng mặt'
    from released r
    on conflict (booking_id, kind) do nothing
    returning pro_id, amount
  ),
  told as (
    insert into public.notifications (account_id, kind, title, body, link)
    select c.pro_id, 'no_show_credited', 'Đã cộng bù phí di chuyển',
           'Khách vắng mặt, không có khiếu nại sau 24 giờ.', '/studio/wallet'
    from credited c
    returning 1
  )
  select count(*) into n from released;
  return n;
end $$;

-- Same as 20260919111530, plus: the dispute's report is closed with the
-- decision, and the freelancer hears the outcome.
create or replace function public.decide_no_show_compensation(p_request uuid, p_approve boolean, p_note text default '') returns void
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
  if claim.dispute_report_id is not null then
    update public.reports
      set status = 'resolved', resolved_at = now(),
          resolution = case when p_approve then 'Giữ báo vắng mặt, bù phí cho chuyên viên.'
                            else 'Không bù phí cho chuyên viên.' end
                       || coalesce(' ' || nullif(trim(p_note), ''), '')
      where id = claim.dispute_report_id and status in ('open', 'reviewing');
  end if;
  perform public.notify(claim.pro_id, 'no_show_decided',
    case when p_approve then 'Đã duyệt bù phí di chuyển' else 'Không duyệt bù phí di chuyển' end,
    coalesce(nullif(trim(p_note), ''), ''), '/bookings/' || claim.booking_id);
end $$;

-- Every fifteen minutes, like the other clean-up work.
do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is not available here; schedules skipped';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname = 'dep360-no-show-release';
  perform cron.schedule('dep360-no-show-release', '*/15 * * * *', 'select public.release_no_show_credits()');
end $$;

revoke all on function
  public.mark_no_show(uuid, text),
  public.dispute_no_show(uuid, text),
  public.release_no_show_credits(),
  public.decide_no_show_compensation(uuid, boolean, text)
from public, anon, authenticated;
grant execute on function
  public.mark_no_show(uuid, text),
  public.dispute_no_show(uuid, text),
  public.decide_no_show_compensation(uuid, boolean, text)
to authenticated;
