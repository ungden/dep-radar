-- Launch day: remove the labelled demo data (supabase/seed/demo.sql) from a
-- live database. Run once, by hand, in the SQL editor or with psql:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/scripts/remove-demo-data.sql
--
-- What goes: the 22 seeded accounts (7 freelancers, 15 customers) by their
-- fixed ids, and everything that hangs off them: profiles, services, hours,
-- works, bookings (also a real customer's booking with a demo freelancer),
-- reviews, chats, wallets, vouchers, notifications. Real accounts are not
-- touched, and the script stops if an id on the list has a real email, Google or
-- Apple sign-in (a sign that the account is not demo after all).
--
-- Then set DEMO_DATA_LIVE = false in lib/launch.ts and deploy (docs/launch.md).

begin;

create temp table demo_ids (id uuid primary key) on commit drop;
insert into demo_ids (id) values
    ('5cb61497-1c4a-49d9-80a2-9864426c89bb'),
    ('9eef8114-88b2-4fe8-8655-35eb03b8bf61'),
    ('5fd22452-981a-4762-8f5d-106d1f03bec9'),
    ('4b0f5d5a-3bdb-4ee4-86ad-3c32d71c235f'),
    ('ffe52497-3a38-41b9-8efc-1b76837aa36d'),
    ('6ecaa96d-5749-4fe4-8384-642d3f798120'),
    ('3d48e94c-1b06-4234-8b62-f63c55989f25'),
    ('f06b6da3-a344-4f36-8c08-bef99f162401'),
    ('9a937381-49b2-4ef9-8edb-2c55ae893c48'),
    ('bdb0d68c-8db6-41bf-8584-4569b2534db0'),
    ('b1e151a4-83e9-46f4-8592-d240360f1d64'),
    ('73433aa8-86d8-43bd-80cd-924c09ff5fce'),
    ('73afbfcc-5f79-464f-8d16-fc4bd4b78ad4'),
    ('cd023aa1-2d9c-4d5a-8daf-edb5c6aca73c'),
    ('ee2c9d96-c553-4f05-8d05-5a54acd5c718'),
    ('d1241708-0ec0-4cd0-85bf-98a098dc5af1'),
    ('85d2b31f-0c89-4731-84cf-8147ae5acb33'),
    ('93164c11-60ad-434d-8cbd-0e217e49a33c'),
    ('545175ee-67df-4326-894e-200fe3b03272'),
    ('e027b0ba-dfba-4717-8b0d-f92acb62a9b8'),
    ('cbe9e85a-9bde-4f14-8fec-bb3bd008b9dd'),
    ('a86f5455-4503-4cb3-8222-596c1f117886');

do $$
declare
  suspicious int;
begin
  -- A demo account was created from the seed with a phone identity; phone
  -- sign-in later gave some a stand-in address (lib/auth/identifier.ts). A real
  -- email, Google or Apple identity means someone actually uses it.
  select count(*) into suspicious from auth.identities i join demo_ids d on d.id = i.user_id
  where i.provider <> 'phone'
    and not (i.provider = 'email' and coalesce(i.identity_data ->> 'email', '') ~ '@(phone\.dep360\.local|sdt\.360dep\.vn)$');
  if suspicious > 0 then
    raise exception 'Stopped: % account(s) on the demo list signed in with email/Google. Check before deleting.', suspicious;
  end if;
end $$;

-- What is about to go, for the record.
select
  (select count(*) from public.accounts where id in (select id from demo_ids)) as demo_accounts,
  (select count(*) from public.pros where id in (select id from demo_ids)) as demo_freelancers,
  (select count(*) from public.works where pro_id in (select id from demo_ids)) as demo_works,
  (select count(*) from public.bookings where customer_id in (select id from demo_ids) or pro_id in (select id from demo_ids)) as bookings,
  (select count(*) from public.bookings b where b.pro_id in (select id from demo_ids) and b.customer_id not in (select id from demo_ids)) as real_customers_bookings_with_demo;

-- Bookings do not cascade from accounts (they are kept when a real account is
-- deleted), so the ones with a demo party go first. Reviews, deliveries and
-- the rest cascade from the booking; threads, vouchers and wallet rows are
-- detached (set null) and go with their account below.
update public.no_show_compensation_requests set decided_by = null where decided_by in (select id from demo_ids);
delete from public.bookings where customer_id in (select id from demo_ids) or pro_id in (select id from demo_ids);

-- auth.users -> accounts -> pros and everything else cascades.
delete from auth.users where id in (select id from demo_ids);

-- What is left.
select
  (select count(*) from public.accounts) as accounts_left,
  (select count(*) from public.pros) as freelancers_left,
  (select count(*) from public.pros where published) as published_left,
  (select count(*) from public.works) as works_left,
  (select count(*) from public.reviews) as reviews_left,
  (select count(*) from public.bookings) as bookings_left;

commit;
