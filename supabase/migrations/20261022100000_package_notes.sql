-- A partner's own note on a package (owner, 21/10/2026): makeup artists say
-- what their package includes that differs from the next artist's (the kind
-- of lashes, a touch-up during the event, hair accessories…). Optional; without
-- one the customer sees the catalogue's own "Bao gồm". The apps offer it on
-- makeup packages; the database takes it on any listing.
--
-- A note is shown to every visitor before any booking, so it may not carry a
-- way to reach the partner outside the app (phone, link, Zalo…) nor anything
-- the content rules refuse.

alter table public.pro_service_prices
  add column note text check (note is null or char_length(note) between 1 and 300);

create function partner_private.check_package_note() returns trigger
language plpgsql security definer set search_path = '' as $$
declare plain text;
begin
  new.note := nullif(btrim(new.note), '');
  if new.note is null then return new; end if;
  if char_length(new.note) > 300 then
    raise exception 'Ghi chú gói tối đa 300 ký tự.' using errcode = 'check_violation';
  end if;
  if public.banned_content(new.note) then
    raise exception 'Ghi chú gói có nội dung không được phép.' using errcode = 'check_violation';
  end if;
  plain := translate(lower(extensions.unaccent('extensions.unaccent'::regdictionary, normalize(new.note, NFC))), 'đ', 'd');
  -- Nine digits in a row, spaces and dots aside, is a phone number; prices and counts never get there.
  if regexp_replace(plain, '[\s.\-]', '', 'g') ~ '\d{9,}'
     or plain ~ '(https?://|www\.|\m[a-z0-9-]+\.(com|vn|net|me|link|ly)\M|\m(zalo|facebook|fb|instagram|insta|ig|tiktok|messenger|telegram|sdt|so dien thoai|lien he|inbox|ib)\M|@[a-z0-9_.]{3,})' then
    raise exception 'Ghi chú gói không ghi số điện thoại, link hay tài khoản mạng xã hội. Khách liên hệ sau khi bạn nhận lịch.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function partner_private.check_package_note() from public, anon, authenticated;
create trigger package_note before insert or update of note on public.pro_service_prices
  for each row execute function partner_private.check_package_note();

-- p_notes: variant -> note; an empty note clears it. Left out (older apps), the
-- notes already saved stay as they are.
drop function public.save_pro_service(text, jsonb, boolean);
create function public.save_pro_service(p_template text, p_prices jsonb, p_active boolean default true, p_notes jsonb default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare me uuid := auth.uid(); item record;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  perform pg_advisory_xact_lock(hashtextextended(me::text, 1));
  if jsonb_typeof(p_prices) <> 'object' or p_prices = '{}'::jsonb then raise exception 'Chọn ít nhất một gói và mức giá.'; end if;
  if p_notes is not null and jsonb_typeof(p_notes) <> 'object' then raise exception 'Ghi chú gói không hợp lệ.'; end if;
  insert into public.pro_services (pro_id, template_id, active) values (me, p_template, p_active)
    on conflict (pro_id, template_id) do update set active = excluded.active;
  for item in select * from jsonb_each_text(p_prices) loop
    insert into public.pro_service_prices (pro_id, template_id, variant_id, price, note)
      values (me, p_template, item.key, item.value::int, case when p_notes is null then null else p_notes ->> item.key end)
      on conflict (pro_id, template_id, variant_id) do update set price = excluded.price,
        note = case when p_notes is null then public.pro_service_prices.note else excluded.note end;
  end loop;
  delete from public.pro_service_prices where pro_id = me and template_id = p_template and not (p_prices ? variant_id);
end $$;
revoke all on function public.save_pro_service(text, jsonb, boolean, jsonb) from public, anon;
grant execute on function public.save_pro_service(text, jsonb, boolean, jsonb) to authenticated;

-- The partner's setup carries the notes next to the prices.
create or replace function partner_private.partner_setup() returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('profile',(select to_jsonb(p) from public.pros p where p.id=auth.uid()),
    'services',coalesce((select jsonb_agg(jsonb_build_object('template_id',s.template_id,'active',s.active,
      'prices',coalesce((select jsonb_object_agg(v.variant_id,v.price) from public.pro_service_prices v
        where v.pro_id=s.pro_id and v.template_id=s.template_id),'{}'::jsonb),
      'notes',coalesce((select jsonb_object_agg(v.variant_id,v.note) from public.pro_service_prices v
        where v.pro_id=s.pro_id and v.template_id=s.template_id and v.note is not null),'{}'::jsonb)))
      from public.pro_services s where s.pro_id=auth.uid()),'[]'::jsonb),
    'hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',weekday,'startMin',start_min,'endMin',end_min))
      from public.working_hours where pro_id=auth.uid()),'[]'::jsonb),
    'workCount',(select count(*) from public.works where pro_id=auth.uid() and hidden_at is null))
$$;
