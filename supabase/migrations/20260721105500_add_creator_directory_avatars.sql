-- Keep public creator profiles visually complete while preserving local fallbacks.
update public.kols
set avatar = case id
  when '101' then '/images/kol/emlyy.jpg'
  when '102' then '/images/kol/ha-giang-ciara.jpg'
  when '103' then '/images/kol/hoang-minh-ngoc.jpg'
  when '104' then '/images/kol/quynh-alee.jpg'
  else avatar
end
where id in ('101', '102', '103', '104');
