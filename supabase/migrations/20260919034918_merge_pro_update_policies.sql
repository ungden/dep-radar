-- Placeholder so the repo's migration history matches the production database.
--
-- In production this version merged the two UPDATE policies on public.pros. The
-- same statements were later folded into 20260919034813_rls_performance.sql, so a
-- fresh `supabase db reset` already has the merged policy by the time it gets
-- here. Running them again would fail on the dropped policy, hence no-op.
select 1;
