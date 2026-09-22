-- Placeholder so the repo's migration history matches the production database.
--
-- In production this version revoked the default EXECUTE grant on
-- public.mark_thread_read(uuid). The same revoke/grant pair lives at the end of
-- 20260919034813_rls_performance.sql. Repeating it is harmless, and keeps this
-- file honest about what production ran.
revoke all on function public.mark_thread_read(uuid) from public, anon, authenticated;
grant execute on function public.mark_thread_read(uuid) to authenticated;
