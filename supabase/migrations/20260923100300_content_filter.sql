-- What may not be asked for on 360dep.
--
-- Casting calls are where a marketplace like this gets abused: "mẫu nội y",
-- "chụp nude nghệ thuật", or a hirer who wants a "phí hồ sơ" from the model before
-- the shoot. None of that is a service anyone here offers, so a post that asks
-- for it is refused outright rather than moderated after the fact. Checked on the
-- rows themselves (castings and customer requests), so no path can skip it.
--
-- Deliberate choices:
--  * Matched without diacritics: people type "khoa than" as easily as "khỏa thân".
--  * "bikini" is allowed. Swimwear shops are legitimate customers of a lookbook.
--  * "nude" alone is allowed: it is a colour ("son nude", "nail tone nude"), and
--    one of our own demo posts is called that. It is refused as a kind of photo:
--    "chụp nude", "ảnh nude", "bán nude", "nude nghệ thuật".
--  * "nhạy cảm" alone is allowed, because "da nhạy cảm" is a skincare service in
--    our own catalogue. It is refused next to a picture word: "ảnh nhạy cảm".
--  * "sugar" alone is allowed ("sugar wax" is waxing); "sugar baby/daddy" is not.
--  * A few phrases are only matched with their accents, because without them they
--    are everyday words: "nội y" would also catch "nói ý", "hở hang" "họ hàng".
--  * Scam markers are refused too: a hirer never takes money from a model.

create extension if not exists unaccent with schema extensions;

create function public.banned_content(p_text text) returns boolean
language sql stable set search_path = '' as $$
  select
    -- The two-argument form names the dictionary, so it works with an empty
    -- search_path. normalize() first: some keyboards send combining marks.
    translate(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, normalize(coalesce(p_text, ''), NFC))),
      'đ', 'd'
    ) ~ (
      '\m(khoa than|nudes|naked|topless|nsfw|onlyfans|sexy|sex|goi cam|khieu dam'
      || '|do lot|quan lot|ao lot|lingerie|underwear|sugar (baby|daddy|mommy)'
      || '|(anh|hinh|canh|noi dung|chup|quay|clip|video) nhay cam'
      || '|(anh|hinh|chup|quay|clip|video|ban|mau|lam mau|model) nude|nude (art|nghe thuat|photo|model)'
      || '|phi ho so|dat coc truoc|chuyen khoan truoc)\M'
      || '|\m18 ?\+'
    )
    or lower(normalize(coalesce(p_text, ''), NFC)) ~* '(nội y|hở hang|ảnh nóng|clip nóng)'
$$;

create function public.refuse_banned_content() returns trigger
language plpgsql security definer set search_path = '' as $$
-- castings have a title and a description, a request only a description. Read
-- through jsonb so one function serves both, like require_phone().
declare r jsonb := to_jsonb(new);
begin
  if public.banned_content(coalesce(r ->> 'title', '') || E'\n' || coalesce(r ->> 'description', '')) then
    raise exception 'Nội dung này không được phép trên 360dep.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- A customer may edit an open request directly (RLS allows it), so the update
-- has to be covered as well as post_job().
create trigger jobs_banned_content
  before insert or update of description on public.jobs
  for each row execute function public.refuse_banned_content();

revoke all on function public.banned_content(text) from public, anon, authenticated;
revoke all on function public.refuse_banned_content() from public, anon, authenticated;
-- Read-only, so a form can warn before it submits.
grant execute on function public.banned_content(text) to anon, authenticated;
