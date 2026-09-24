-- Two things the end-to-end run of both flows on production found (2026-09-24).

-- 1. "Làm móng màu nude" was refused. The filter matches without diacritics,
--    and there "màu nude" (the colour) and "mẫu nude" (a nude model) are both
--    "mau nude". The model is now only matched with its accents, like "nội y";
--    everything else about the filter (20260923100300) is unchanged.
create or replace function public.banned_content(p_text text) returns boolean
language sql stable set search_path = '' as $$
  select
    translate(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, normalize(coalesce(p_text, ''), NFC))),
      'đ', 'd'
    ) ~ (
      '\m(khoa than|nudes|naked|topless|nsfw|onlyfans|sexy|sex|goi cam|khieu dam'
      || '|do lot|quan lot|ao lot|lingerie|underwear|sugar (baby|daddy|mommy)'
      || '|(anh|hinh|canh|noi dung|chup|quay|clip|video) nhay cam'
      || '|(anh|hinh|chup|quay|clip|video|ban|model) nude|nude (art|nghe thuat|photo|model)'
      || '|phi ho so|dat coc truoc|chuyen khoan truoc)\M'
      || '|\m18 ?\+'
    )
    or lower(normalize(coalesce(p_text, ''), NFC)) ~* '(nội y|hở hang|ảnh nóng|clip nóng|mẫu nude)'
$$;

-- 2. "Tổng 0 lịch đã làm" next to "1 lịch hoàn thành": completed_jobs was only
--    recounted by the nightly recompute_pro_metrics(). Recount it the moment a
--    booking enters or leaves "completed", as the system (guard_pro_update()
--    keeps these counters out of a freelancer's own writes).
create function public.recount_completed_jobs() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.status = 'completed') is distinct from (old.status = 'completed') then
    perform set_config('app.system_write', 'on', true);
    update public.pros set completed_jobs =
      (select count(*) from public.bookings where pro_id = new.pro_id and status = 'completed')
    where id = new.pro_id;
    perform set_config('app.system_write', '', true);
  end if;
  return null;
end $$;

revoke execute on function public.recount_completed_jobs() from public, anon, authenticated;

create trigger booking_recount_completed
  after update of status on public.bookings
  for each row execute function public.recount_completed_jobs();
