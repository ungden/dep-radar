create schema marketplace_metrics;
revoke all on schema marketplace_metrics from public;

-- A random ID per booking screen. No customer, address, free text or device ID.
create table marketplace_metrics.marketplace_steps (
  flow uuid not null,
  step text not null check (step in ('opened','slot_chosen','confirmation','failed','created')),
  created_at timestamptz not null default now(),
  primary key(flow, step)
);
create index marketplace_steps_recent on marketplace_metrics.marketplace_steps(created_at);
alter table marketplace_metrics.marketplace_steps enable row level security;
revoke all on marketplace_metrics.marketplace_steps from public, anon, authenticated;

create function marketplace_metrics.note_marketplace_step(p_flow uuid, p_step text) returns void
language sql security definer set search_path = '' as $$
  insert into marketplace_metrics.marketplace_steps(flow, step)
  select p_flow, p_step
  where p_flow is not null and p_step in ('opened','slot_chosen','confirmation','failed','created')
  on conflict do nothing
$$;
create function public.note_marketplace_step(p_flow uuid, p_step text) returns void
language sql security invoker set search_path = '' as $$
  select marketplace_metrics.note_marketplace_step(p_flow, p_step)
$$;
revoke all on function marketplace_metrics.note_marketplace_step(uuid,text), public.note_marketplace_step(uuid,text) from public, anon, authenticated;
grant usage on schema marketplace_metrics to anon, authenticated;
grant execute on function marketplace_metrics.note_marketplace_step(uuid,text), public.note_marketplace_step(uuid,text) to anon, authenticated;

create function partner_private.support_marketplace_signals() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not partner_private.support_access() then raise exception 'Bạn không có quyền xem bàn CSKH.' using errcode = 'insufficient_privilege'; end if;
  return (select coalesce(jsonb_object_agg(step,n), '{}') from (
    select step,count(*) as n from marketplace_metrics.marketplace_steps
    where created_at >= now() - interval '7 days' group by step
  ) q);
end $$;
create function public.support_marketplace_signals() returns jsonb
language sql security invoker set search_path = '' as $$
  select partner_private.support_marketplace_signals()
$$;
revoke all on function partner_private.support_marketplace_signals(), public.support_marketplace_signals() from public, anon;
grant execute on function partner_private.support_marketplace_signals(), public.support_marketplace_signals() to authenticated;

do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.schedule('dep360-marketplace-signal-retention', '24 18 * * *',
      $job$delete from marketplace_metrics.marketplace_steps where created_at < now() - interval '30 days'$job$);
  end if;
end $$;
