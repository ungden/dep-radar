-- Creator collection currently has a minimum configured interval of two hours.
-- An hourly dispatcher keeps that SLA while avoiding 12 empty checks per hour.
do $$
begin
  perform cron.unschedule('evidence-radar-enqueue-due-accounts');
exception
  when others then null;
end $$;

select cron.schedule(
  'evidence-radar-enqueue-due-accounts',
  '0 * * * *',
  'select private.enqueue_due_creator_accounts()'
);
