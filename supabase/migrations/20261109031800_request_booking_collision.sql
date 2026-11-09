-- Lock provider -> customer -> request on both claim and direct booking paths.
-- A direct booking can supersede a waiting request, but cannot create a
-- second appointment after someone has already accepted the same request.
do $$
declare original text; updated text; needle text;
begin
  select pg_get_functiondef('public.take_job(uuid)'::regprocedure) into original;
  needle := '  select * into j from public.jobs where id = p_job for update;';
  updated := replace(original,needle,
    '  perform pg_advisory_xact_lock(hashtextextended(customer_id::text,22)) from public.jobs where id=p_job;' || E'\n' || needle);
  if updated=original then raise exception 'Unexpected take_job implementation'; end if;
  execute updated;
end $$;

create or replace function partner_private.close_overlapping_jobs() returns trigger
language plpgsql security definer set search_path='' as $$
declare span tstzrange:=tstzrange(new.starts_at,new.starts_at+make_interval(mins=>new.duration_min),'[)');
  taking text:=coalesce(current_setting('app.taking_job',true),''); n int;
begin
  if new.in_cart then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.customer_id::text,22));
  if exists (select 1 from public.bookings b where b.id<>new.id and not b.in_cart
    and b.customer_id=new.customer_id and b.template_id=new.template_id and b.status in ('pending','confirmed','in_progress')
    and (b.source='job' or new.source='job') and tstzrange(b.starts_at,b.ends_at,'[)')&&span) then
    raise exception 'Bạn đã có lịch cho dịch vụ này vào giờ đó.' using errcode='check_violation';
  end if;
  update public.jobs j set status='closed'
  where j.customer_id=new.customer_id and j.status='open' and j.template_id=new.template_id
    and j.id::text<>taking
    and tstzrange(j.starts_at,j.starts_at+make_interval(mins=>coalesce(public.service_duration_min(j.template_id,j.variant_id,j.quantity),0)),'[)')&&span;
  get diagnostics n=row_count;
  if n>0 then
    perform public.notify(new.customer_id,'job_closed','Đơn đang chờ đã đóng',
      'Bạn đã có lịch cho dịch vụ này cùng giờ nên đơn đang chờ Artist nhận đã được đóng.','/requests');
  end if;
  return new;
end $$;
