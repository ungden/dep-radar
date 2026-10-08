-- Staff read the chat behind a complaint, per the owner's spec (08/10/2026).
--
-- Messages stay private to the two people in them: no RLS policy lets the
-- staff read the table. The one way in is this function, which needs a report
-- (the chat between the reporter and the person reported, or between the
-- customer and the partner of the reported booking) and writes every look into
-- the admin log, so who read which conversation, and why, is on record.
-- Chat photos are signed by the server for an admin after this returns.

create function public.admin_report_chat(p_report uuid) returns table (
  message_id uuid, thread_id uuid, booking_id uuid, sent_at timestamptz, sender text, body text, image_paths text[]
)
language plpgsql security definer set search_path = '' as $$
declare r public.reports; c uuid; p uuid;
begin
  perform public.require_admin();
  select * into r from public.reports where id = p_report;
  if r.id is null then raise exception 'Không tìm thấy báo cáo.' using errcode = 'no_data_found'; end if;

  if r.booking_id is not null then
    select b.customer_id, b.pro_id into c, p from public.bookings b where b.id = r.booking_id;
  elsif exists (select 1 from public.pros where id = r.target_account_id) then
    c := r.reporter_id; p := r.target_account_id;
  elsif exists (select 1 from public.pros where id = r.reporter_id) then
    c := r.target_account_id; p := r.reporter_id;
  end if;
  if c is null or p is null then return; end if;

  perform public.log_admin_action('report:view_chat', r.id, jsonb_build_object('customer', c, 'pro', p, 'reason', r.reason));

  return query
    select x.id, x.thread_id, x.booking_id, x.created_at, x.sender, x.body, x.image_paths from (
      select m.id, m.thread_id, t.booking_id, m.created_at,
             case when m.sender_id = t.pro_id then 'pro' else 'customer' end as sender, m.body, m.image_paths
      from public.messages m join public.threads t on t.id = m.thread_id
      where t.customer_id = c and t.pro_id = p
      order by m.created_at desc
      limit 300
    ) x
    order by x.created_at;
end $$;
revoke all on function public.admin_report_chat(uuid) from public, anon;
grant execute on function public.admin_report_chat(uuid) to authenticated;
