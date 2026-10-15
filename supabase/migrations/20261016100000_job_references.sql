-- Reference photos on a request ("ảnh mẫu"), as bookings have had since
-- 20261008100100: the customer shows the look they want (a make-up tone, a
-- hairstyle), so a partner sees it before taking the job and passes on one
-- they cannot do. Words describe a tone badly; a picture does it at a glance.
--
-- Same bucket and the same limit (1 to 3, under the customer's own folder).
-- Whoever may read the request may read its photos; once someone takes it,
-- the photos go with the booking it became, where the booking's policy covers
-- them.

alter table public.jobs add column reference_photos text[] not null default '{}'
  check (cardinality(reference_photos) <= 3);

-- Updates on jobs are revoked from clients (20260926100000), so the owner sets
-- the photos through this, while the request is still open.
create function public.set_job_references(p_job uuid, p_paths text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); j public.jobs; p text;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into j from public.jobs where id = p_job for update;
  if j is null or j.customer_id <> me then
    raise exception 'Không tìm thấy yêu cầu.' using errcode = 'no_data_found';
  end if;
  if j.status <> 'open' then
    raise exception 'Chỉ gửi ảnh mẫu cho yêu cầu chưa có người nhận.' using errcode = 'check_violation';
  end if;
  if coalesce(cardinality(p_paths), 0) > 3 then raise exception 'Gửi tối đa 3 ảnh mẫu.' using errcode = 'check_violation'; end if;
  foreach p in array coalesce(p_paths, '{}') loop
    if split_part(p, '/', 1) <> me::text then
      raise exception 'Ảnh mẫu không hợp lệ.' using errcode = 'check_violation';
    end if;
  end loop;
  update public.jobs set reference_photos = coalesce(p_paths, '{}') where id = j.id;
end $$;

revoke all on function public.set_job_references(uuid, text[]) from public, anon;
grant execute on function public.set_job_references(uuid, text[]) to authenticated;

-- A partner who can see the open request (row level security on jobs applies
-- inside this check) can see its photos.
create policy "request viewers read reference photos" on storage.objects for select to authenticated
  using (bucket_id = 'references' and exists (
    select 1 from public.jobs j where j.reference_photos @> array[objects.name]
  ));

-- take_job turns the request into a booking; its photos go along.
create function public.job_references_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.booking_id is not null and old.booking_id is distinct from new.booking_id and cardinality(new.reference_photos) > 0 then
    update public.bookings set reference_photos = new.reference_photos
    where id = new.booking_id and cardinality(reference_photos) = 0;
  end if;
  return new;
end $$;

revoke all on function public.job_references_follow() from public, anon, authenticated;

create trigger jobs_references_follow after update of booking_id on public.jobs
  for each row execute function public.job_references_follow();
