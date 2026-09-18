-- A portfolio piece is a landing page ("nail milky đính đá nhẹ"), so it needs a
-- readable address. Without this the app would have to put a uuid in the URL.

alter table public.works add column slug text;

-- Strip Vietnamese diacritics down to an ASCII slug.
create function public.slugify(input text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        lower(translate(
          input,
          'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
          'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
        )),
        '[^a-z0-9]+', '-', 'g'
      )),
      ''),
    'tac-pham')
$$;

update public.works w set slug = base.slug || case when base.rn = 1 then '' else '-' || base.rn end
from (
  select id, public.slugify(title) as slug,
         row_number() over (partition by public.slugify(title) order by created_at, id) as rn
  from public.works
) base
where base.id = w.id;

alter table public.works alter column slug set not null;
create unique index works_slug_idx on public.works (slug);

grant execute on function public.slugify(text) to anon, authenticated;
