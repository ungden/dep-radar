-- Gaps that turn into disputes, found while writing the help centre
-- (lib/help/knowledge.ts says what the system does; these make it true).
--
-- 1. A block now also stops direct bookings, not only messages and requests.
-- 2. A request cannot be posted as "online" payment, which does not exist yet.
-- 3. "Bắt đầu" opens 15 minutes before the start, not an hour: pressing it
--    takes away the customer's "Người làm không đến" button, so it should
--    mean "I am here".
-- 4. Every new report reaches the staff (only no-show reports did), and the
--    person who reported hears the outcome.
-- 5. A disputed no-show: the customer hears the outcome too, not only the
--    freelancer.
-- 6. A request nobody took tells the customer it expired.
-- 7. Files late: the customer is told as well, and the freelancer is no longer
--    told to "message the customer" in a chat that closed at completion.
-- Function bodies are the live definitions with only those changes.

-- 1 ---------------------------------------------------------------------------
create function public.booking_not_blocked() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.blocked_between(new.customer_id, new.pro_id) then
    -- Same words either way: the blocked side is never told about a block.
    raise exception 'Không đặt được lịch với người làm này.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function public.booking_not_blocked() from public, anon, authenticated;

create trigger bookings_not_blocked before insert on public.bookings
  for each row execute function public.booking_not_blocked();

-- 2 ---------------------------------------------------------------------------
create function public.job_payment_available() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.payment_method = 'online' then
    raise exception 'Thanh toán online chưa hoạt động.' using errcode = 'feature_not_supported';
  end if;
  return new;
end $$;
revoke all on function public.job_payment_available() from public, anon, authenticated;

create trigger jobs_payment_available before insert on public.jobs
  for each row execute function public.job_payment_available();

-- 3 ---------------------------------------------------------------------------
create or replace function public.start_booking(p_booking uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'confirmed' then
    raise exception 'Chỉ bắt đầu được job đã xác nhận.' using errcode = 'check_violation';
  end if;
  if now() < b.starts_at - interval '15 minutes' then
    raise exception 'Bấm "Bắt đầu" khi đã tới nơi, từ 15 phút trước giờ hẹn.' using errcode = 'check_violation';
  end if;
  update public.bookings set status = 'in_progress', started_at = now() where id = p_booking;
end $function$;

-- 4 ---------------------------------------------------------------------------
-- No-show reports and no-show disputes already notify the staff themselves.
create function public.report_notify_staff() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.reason in ('pro_no_show', 'no_show_dispute') then return new; end if;
  insert into public.notifications (account_id, kind, title, body, link)
  select a.id, 'report_new', 'Báo cáo mới: ' || left(new.reason, 80), left(coalesce(new.detail, ''), 200), '/admin'
  from public.accounts a where a.is_admin;
  return new;
end $$;
revoke all on function public.report_notify_staff() from public, anon, authenticated;

create trigger reports_notify_staff after insert on public.reports
  for each row execute function public.report_notify_staff();

create or replace function public.resolve_report(p_report uuid, p_status text, p_resolution text default ''::text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare r public.reports;
begin
  if not public.is_admin() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  if p_status not in ('reviewing', 'resolved', 'rejected') then
    raise exception 'Trạng thái không hợp lệ.' using errcode = 'check_violation';
  end if;
  update public.reports
    set status = p_status,
        resolution = nullif(p_resolution, ''),
        resolved_at = case when p_status in ('resolved', 'rejected') then now() end
    where id = p_report
    returning * into r;
  -- The person who reported hears how it ended.
  if r.id is not null and p_status in ('resolved', 'rejected') and r.reporter_id is not null then
    perform public.notify(r.reporter_id, 'report_resolved', '360dep đã xử lý báo cáo của bạn',
      coalesce(nullif(trim(p_resolution), ''),
        case when p_status = 'resolved' then 'Cảm ơn bạn đã báo. Đội ngũ đã xem xét và xử lý theo quy chế.'
             else 'Đội ngũ đã xem xét và chưa thấy vi phạm cần xử lý. Liên hệ hỗ trợ nếu bạn có thêm thông tin.' end),
      case when r.booking_id is not null then '/bookings/' || r.booking_id else '/thong-bao' end);
  end if;
end $function$;

-- 5 ---------------------------------------------------------------------------
create or replace function public.decide_no_show_compensation(p_request uuid, p_approve boolean, p_note text default ''::text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare claim public.no_show_compensation_requests; customer uuid;
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
  -- The customer who disputed hears it too. Neither outcome costs them anything.
  select b.customer_id into customer from public.bookings b where b.id = claim.booking_id;
  if customer is not null and claim.dispute_report_id is not null then
    perform public.notify(customer, 'no_show_decided', '360dep đã xem xét khiếu nại vắng mặt',
      case when p_approve then 'Đội ngũ giữ ghi nhận vắng mặt của lịch hẹn này. Bạn không bị thu khoản nào.'
           else 'Đội ngũ chấp nhận khiếu nại của bạn. Bạn không bị thu khoản nào.' end
      || coalesce(' ' || nullif(trim(p_note), ''), ''),
      '/bookings/' || claim.booking_id);
  end if;
end $function$;

-- 6 ---------------------------------------------------------------------------
create or replace function public.expire_stale_jobs()
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare n int;
begin
  with done as (
    update public.jobs set status = 'expired'
      where status = 'open' and starts_at < now()
      returning id, customer_id, template_id
  ),
  told as (
    insert into public.notifications (account_id, kind, title, body, link)
    select d.customer_id, 'job_expired', 'Yêu cầu chưa có người nhận',
           'Yêu cầu ' || coalesce((select t.name from public.service_templates t where t.id = d.template_id), 'dịch vụ')
             || ' đã tới giờ mà chưa có người nhận nên đã hết hạn. Bạn có thể đặt trực tiếp một người làm hoặc đăng lại cho giờ khác.',
           '/requests'
    from done d
    returning 1
  )
  select count(*) into n from done;
  update public.offers set status = 'rejected'
    where status = 'pending' and (expires_at < now()
      or job_id in (select id from public.jobs where status <> 'open'));
  update public.castings set status = 'closed' where status = 'open' and starts_at < now();
  return n;
end $function$;

-- 7 ---------------------------------------------------------------------------
create or replace function public.remind_overdue_deliveries()
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare n int;
begin
  with due as (
    select b.id, b.pro_id, b.customer_id
    from public.bookings b
    where b.status = 'completed'
      and b.delivered_at is null
      and b.delivery_due_at < now()
      and not exists (
        select 1 from public.notifications x
        where x.account_id = b.pro_id and x.kind = 'delivery_overdue' and x.link = '/bookings/' || b.id
      )
  ),
  to_pro as (
    insert into public.notifications (account_id, kind, title, body, link)
    select d.pro_id, 'delivery_overdue', 'Đã quá hạn giao file',
           'Khách đang chờ ảnh/clip theo hạn trong gói. Gửi link tải ngay trong chi tiết lịch hẹn.', '/bookings/' || d.id
    from due d
    returning 1
  ),
  to_customer as (
    insert into public.notifications (account_id, kind, title, body, link)
    select d.customer_id, 'delivery_overdue', 'Người làm chưa giao file đúng hạn',
           '360dep đã nhắc người làm. Nếu vẫn chưa nhận được, hãy dùng "Báo cáo vấn đề" trong lịch hẹn.', '/bookings/' || d.id
    from due d
    returning 1
  )
  select count(*) into n from to_pro;
  return n;
end $function$;
