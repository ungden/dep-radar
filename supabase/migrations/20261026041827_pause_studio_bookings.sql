-- Hold studio visits back while new bookings focus on travelling freelancers.
-- No existing booking or partner studio address is changed.
create function partner_private.guard_travelling_freelancer_booking() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not new.at_home then
    -- An add-on to a previously agreed studio booking keeps that appointment's
    -- location. It cannot create a new standalone studio appointment.
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
revoke all on function partner_private.guard_travelling_freelancer_booking() from public, anon, authenticated;

create trigger aaa_travelling_freelancer_booking before insert on public.bookings
  for each row execute function partner_private.guard_travelling_freelancer_booking();
create trigger aaa_travelling_freelancer_job before insert on public.jobs
  for each row execute function partner_private.guard_travelling_freelancer_booking();
