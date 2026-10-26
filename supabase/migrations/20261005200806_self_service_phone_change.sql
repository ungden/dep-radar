-- Authenticated users may change their own phone; uniqueness and the write guard remain.
-- The existing RPC name keeps older native clients compatible.
create or replace function public.set_my_phone(p_phone text) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); v_phone text := public.normalize_vn_phone(p_phone); v_current text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if v_phone is null then
    raise exception 'Số điện thoại không hợp lệ. Nhập số di động Việt Nam.' using errcode = 'check_violation';
  end if;
  select a.phone into v_current from public.accounts a where a.id = me for update;
  if v_current is null then raise exception 'Không tìm thấy tài khoản.' using errcode = 'no_data_found'; end if;
  if v_current = v_phone then return v_phone; end if;
  if exists (select 1 from public.accounts a where a.phone = v_phone and a.id <> me) then
    raise exception 'Số điện thoại này đã thuộc một tài khoản khác.' using errcode = 'check_violation';
  end if;
  perform set_config('app.setting_phone', me::text, true);
  update public.accounts a set phone = v_phone where a.id = me;
  perform set_config('app.setting_phone', '', true);
  return v_phone;
exception when unique_violation then
  raise exception 'Số điện thoại này đã thuộc một tài khoản khác.' using errcode = 'check_violation';
end $$;

revoke all on function public.set_my_phone(text) from public, anon;
grant execute on function public.set_my_phone(text) to authenticated;
