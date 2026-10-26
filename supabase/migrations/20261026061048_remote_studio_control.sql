-- One admin-controlled setting is shared by web, native apps and booking writes.
-- Existing SELECT/UPDATE RLS and the settings audit trigger cover the new column.
alter table public.platform_settings
  add column studio_booking_open boolean not null default false;

create or replace function partner_private.guard_travelling_freelancer_booking() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not new.at_home and not coalesce((
    select s.studio_booking_open from public.platform_settings s where s.id
  ), false) then
    if tg_table_name = 'bookings' then
      if new.parent_booking_id is not null and exists (
        select 1 from public.bookings b where b.id = new.parent_booking_id and not b.at_home
      ) then return new; end if;
    end if;
    raise exception 'Hiện chỉ nhận lịch freelancer đến nhà hoặc địa điểm khách chọn. Đặt lịch tại studio chưa mở.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
