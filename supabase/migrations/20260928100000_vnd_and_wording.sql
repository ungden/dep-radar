-- Two things the first end-to-end run on production showed (24/09/2026):
--
-- 1. Amounts in notifications read "27,000đ": to_char's G is the database
--    locale's separator, a comma, where Vietnamese writes a dot. vnd() is the
--    one formatter, and every function that formatted money with
--    'FM999G999G999' is rewritten to call it.
-- 2. A new booking still told the freelancer to "Gọi cho khách để xác nhận"
--    (call the customer to confirm): since 20260926100000 they accept in the
--    app, and only then can the two talk.
--
-- The rewrite works on each function's own definition, so it keeps whatever
-- the latest migration made of it.

create or replace function public.vnd(n numeric) returns text
language sql immutable set search_path = '' as $$
  select replace(to_char(n, 'FM999G999G999G999'), ',', '.')
$$;

revoke all on function public.vnd(numeric) from public, anon, authenticated;

do $$
declare f record; def text; fixed text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname <> 'vnd'
      and (p.prosrc like '%FM999G999G999%' or p.prosrc like '%Gọi cho khách để xác nhận%')
  loop
    def := pg_get_functiondef(f.oid);
    -- to_char(<amount>, 'FM999G999G999') -> public.vnd(<amount>). The amount
    -- never contains a quote, which keeps a date's to_char(..., 'DD/MM') on the
    -- same line out of the match.
    fixed := regexp_replace(def, 'to_char\(([^'']*?), ''FM999G999G999''\)', 'public.vnd(\1)', 'g');
    fixed := replace(fixed, 'Gọi cho khách để xác nhận trước khi nhận job.', 'Xem giờ, địa chỉ rồi bấm Nhận lịch. Nhận rồi hai bên mới nhắn tin được.');
    fixed := replace(fixed, 'Gọi cho khách để xác nhận nhận job.', 'Xem giờ, địa chỉ rồi bấm Nhận lịch.');
    if fixed <> def then
      execute fixed;
    end if;
  end loop;
end $$;
