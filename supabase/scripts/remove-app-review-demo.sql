-- Removes the sample content added by app-review-demo.sql (ids prefixed ae000000-).
-- The review account itself, its name, partner profile and working hours stay.

begin;
select set_config('app.system_write', 'on', true);

delete from public.notifications where link in (
  select '/tin-nhan/' || id from public.threads where id::text like 'ae000000-%'
  union all select '/bookings/' || id from public.bookings where id::text like 'ae000000-%');
delete from public.messages where thread_id::text like 'ae000000-%';
delete from public.threads where id::text like 'ae000000-%';
delete from public.reviews where booking_id::text like 'ae000000-%';
delete from public.wallet_entries where id::text like 'ae000000-%';
delete from public.bookings where id::text like 'ae000000-%';

update public.pros set completed_jobs = 0, rating_avg = 0, rating_count = 0
where id = '09b832da-c782-4638-acd9-b59541cea00e';

commit;
