-- The platform's own details: where a freelancer transfers money to top up the
-- wallet, how to reach support, and the company line the law wants in a footer.
--
-- They were nowhere, so the wallet screen could only say "liên hệ hỗ trợ". They
-- are data, not code: a bank account changes without a deploy, and the app shows
-- nothing it does not have (every column starts null, and a null field is simply
-- not shown). One row, like fee_policy. Anyone may read it -- it is what a
-- payment page prints -- and only an admin may change it. The owner fills it in
-- once by SQL (see README, "Vận hành").

create table public.platform_settings (
  id boolean primary key default true check (id),
  -- The bank's BIN (e.g. 970436 for Vietcombank), which a VietQR code needs.
  topup_bank_bin text check (topup_bank_bin ~ '^[0-9]{6}$'),
  topup_account_no text check (topup_account_no ~ '^[0-9]{4,20}$'),
  topup_account_name text check (char_length(topup_account_name) <= 100),
  support_zalo text check (char_length(support_zalo) <= 100),
  support_email text check (char_length(support_email) <= 200),
  company_name text check (char_length(company_name) <= 200),
  company_tax_id text check (char_length(company_tax_id) <= 20),
  company_address text check (char_length(company_address) <= 300)
);

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

create policy "platform settings are public" on public.platform_settings for select using (true);
create policy "admin edits platform settings" on public.platform_settings
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
-- No insert or delete: there is exactly one row.

revoke all on public.platform_settings from anon, authenticated;
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
