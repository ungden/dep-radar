-- Sign-in with a password instead of an SMS code.
--
-- The identity Supabase Auth holds is now email + password: that is what a
-- forgotten password can be recovered through. The phone number stays what the
-- product is built on (a freelancer calls the customer, one number is one
-- account), so it is still required, still in E.164, and now unique by
-- constraint rather than by being the auth identity itself.

-- One canonical form, the same rules as toE164() in lib/auth/phone.ts:
-- "0968 112 233", "84968112233" and "+84968112233" are one number.
create function public.normalize_vn_phone(input text) returns text
language plpgsql immutable set search_path = '' as $$
declare digits text := regexp_replace(coalesce(input, ''), '\D', '', 'g');
begin
  if digits like '0084%' then digits := substr(digits, 5);
  elsif digits like '84%' and length(digits) >= 11 then digits := substr(digits, 3);
  elsif digits like '0%' then digits := substr(digits, 2);
  end if;
  if digits !~ '^[35789][0-9]{8}$' then return null; end if;
  return '+84' || digits;
end $$;

-- '' is the tombstone delete_my_account() leaves behind; everything else is E.164.
alter table public.accounts
  add constraint accounts_phone_format check (phone = '' or phone ~ '^\+84[35789][0-9]{8}$');
create unique index accounts_phone_key on public.accounts (phone) where phone <> '';

-- A new account must arrive with a usable phone number, from wherever the sign-up
-- came: the phone identity (legacy and seed data) or the metadata our sign-up
-- action sends. The browser can call Auth directly with the anon key, so this is
-- the check that cannot be skipped; the action only makes its message kinder.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare phone text := public.normalize_vn_phone(coalesce(nullif(new.phone, ''), new.raw_user_meta_data ->> 'phone'));
begin
  if phone is null then
    raise exception 'Cần số điện thoại di động Việt Nam hợp lệ.' using errcode = 'check_violation';
  end if;
  insert into public.accounts (id, full_name, phone)
  values (new.id, left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), phone)
  on conflict (id) do nothing;
  return new;
end $$;

-- Signing in with a phone number means finding the email behind it. Only the
-- server may ask: answered to a browser, this would turn any number into an
-- email address.
create function public.account_email_for_phone(p_phone text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email
  from public.accounts a
  join auth.users u on u.id = a.id
  where a.phone = public.normalize_vn_phone(p_phone)
    and u.email is not null
  limit 1
$$;

revoke all on function public.normalize_vn_phone(text) from public, anon, authenticated;
revoke all on function public.account_email_for_phone(text) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.account_email_for_phone(text) to service_role;
grant execute on function public.normalize_vn_phone(text) to service_role;
