-- Table privileges, spelled out instead of inherited from whatever default
-- privileges happen to be in place. Row level security is what decides which
-- rows; these grants only decide which tables the API may look at.

grant usage on schema public to anon, authenticated, service_role;

-- Reading is governed by the select policies in 20260918040400_rls.sql.
grant select on all tables in schema public to anon, authenticated;

-- Writing is governed by the insert/update/delete policies. A table with no
-- write policy (bookings, offers, wallet_entries, ...) stays read-only for
-- clients no matter what they send: those changes only happen inside an RPC.
grant insert, update, delete on all tables in schema public to authenticated;

-- The service role is the platform itself: identity checks, cron work, admin.
grant all on all tables in schema public to service_role;

alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
