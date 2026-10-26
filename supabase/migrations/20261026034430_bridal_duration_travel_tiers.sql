-- Three hours per bridal makeup appointment (hair included). Existing bookings
-- and their contract/duration/fee snapshots intentionally remain unchanged.
update public.service_variants
set duration_min = greatest(duration_min, 180)
where template_id in ('makeup-bridal', 'makeup-prewedding');

update public.service_templates
set description = case id
  when 'makeup-bridal' then 'Makeup và làm tóc cô dâu cho từng lễ, dự kiến 3 giờ mỗi buổi. Nên test makeup trước để xem layout đã chọn có hợp không.'
  when 'makeup-prewedding' then 'Makeup cô dâu cho buổi chụp ảnh cưới trong studio hoặc ngoại cảnh. Dự kiến ít nhất 3 giờ, đã gồm làm tóc.'
end
where id in ('makeup-bridal', 'makeup-prewedding');

alter table public.fee_policy
  add column near_travel_km numeric(5, 1) not null default 5 check (near_travel_km > 0),
  add column near_travel_fee int not null default 50000 check (near_travel_fee >= 0);

-- Retain the old columns for compatibility with existing readers; the new
-- function no longer uses the free-radius/per-km formula.
update public.fee_policy
set free_travel_km = 0, travel_fee_per_km = 0,
    near_travel_km = 5, near_travel_fee = 50000, travel_fee_cap = 100000,
    updated_at = now()
where id;

create or replace function public.travel_fee(distance_km numeric) returns int
language plpgsql stable set search_path = '' as $$
declare p record;
begin
  if distance_km is null or distance_km < 0 or distance_km::text in ('NaN', 'Infinity', '-Infinity') then return 0; end if;
  select * into p from public.fee_policy where id;
  if distance_km < p.near_travel_km then return p.near_travel_fee; end if;
  -- Includes exactly 5 km, 5–10 km and longer trips within the partner's radius.
  return p.travel_fee_cap;
end $$;
