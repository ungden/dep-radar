drop policy if exists "Allow public read-only access on kols" on public.kols;

create policy "Public reads active creator directory"
on public.kols
for select
to anon, authenticated
using (directory_status = 'active');
