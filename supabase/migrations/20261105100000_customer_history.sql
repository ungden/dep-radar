-- What a partner sees at the top of a chat: whether this customer is new to
-- them and to 360đẹp. Only counts of completed bookings, only for the partner
-- of this thread: they cannot read the customer's other bookings themselves.
create function public.customer_history(p_thread uuid)
returns table (with_me int, overall int)
language plpgsql stable security definer set search_path = '' as $$
declare
  t public.threads;
begin
  select * into t from public.threads where id = p_thread;
  if t is null or auth.uid() is distinct from t.pro_id then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  return query
    select (count(*) filter (where b.pro_id = t.pro_id))::int, count(*)::int
    from public.bookings b
    where b.customer_id = t.customer_id and b.status = 'completed';
end $$;

revoke all on function public.customer_history(uuid) from public, anon;
grant execute on function public.customer_history(uuid) to authenticated;
