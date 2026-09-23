-- Giới thiệu bạn bè, the way bTaskee and Be do it, fitted to how 360dep takes
-- money (customers pay the freelancer directly; freelancers keep a prepaid
-- wallet that commission comes out of).
--
-- Everyone has a code (6 letters, no 0/O/1/I). A new account can enter one
-- within 30 days of signing up, once. Nothing is paid for signing up; the
-- reward comes when the friend actually uses 360dep:
--
-- * The friend books as a customer: when their first booking worth at least
--   referral_min_total (150.000đ) is completed -- with a freelancer who is not
--   the person who invited them -- both get a voucher of
--   referral_customer_amount (50.000đ), valid voucher_days (60) days.
-- * The friend works as a freelancer: when they have completed 3 jobs for 3
--   different customers (none of them the person who invited them), both get
--   referral_pro_amount (100.000đ) -- as wallet credit if they are a
--   freelancer, as a voucher of that value if they are not.
--
-- One reward per invited account, within 90 days of the invitation, at most
-- referral_monthly_cap (20) rewards a month per inviter. Phone numbers are
-- unique per account, so one person cannot be both sides.
--
-- A voucher is used on a booking before it starts. The customer pays the
-- freelancer the total minus the voucher; when the job is completed 360dep
-- credits the voucher to the freelancer's wallet, so the freelancer is paid
-- the full price. A booking that does not go ahead gives the voucher back.
--
-- Turned off with platform_settings.referral_enabled = false.

alter table public.platform_settings
  add column referral_enabled boolean not null default true,
  add column referral_customer_amount int not null default 50000 check (referral_customer_amount between 0 and 1000000),
  add column referral_pro_amount int not null default 100000 check (referral_pro_amount between 0 and 1000000),
  add column referral_min_total int not null default 150000 check (referral_min_total >= 0),
  add column referral_monthly_cap int not null default 20 check (referral_monthly_cap >= 0),
  add column voucher_days int not null default 60 check (voucher_days between 1 and 365);

alter table public.accounts
  add column referral_code text unique check (referral_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  add column referred_by uuid references public.accounts (id) on delete set null,
  add column referred_at timestamptz;

create index accounts_referred_by_idx on public.accounts (referred_by) where referred_by is not null;

alter table public.wallet_entries drop constraint wallet_entries_kind_check;
alter table public.wallet_entries add constraint wallet_entries_kind_check
  check (kind in ('topup', 'commission', 'adjustment', 'refund', 'no_show_comp', 'voucher', 'referral'));

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount int not null check (amount > 0),
  min_total int not null default 0 check (min_total >= 0),
  expires_at timestamptz not null,
  -- The booking it is on, while that booking is going ahead.
  booking_id uuid unique references public.bookings (id) on delete set null,
  used_at timestamptz,
  source text not null default 'referral' check (source in ('referral', 'admin')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index vouchers_account_idx on public.vouchers (account_id, expires_at);

alter table public.vouchers enable row level security;
create policy "own vouchers" on public.vouchers for select using (
  account_id = (select auth.uid()) or (select public.is_admin())
);
revoke all on public.vouchers from anon, authenticated;
grant select on public.vouchers to authenticated;
grant all on public.vouchers to service_role;

create table public.referral_rewards (
  referee uuid primary key references public.accounts (id) on delete cascade,
  referrer uuid not null references public.accounts (id) on delete cascade,
  kind text not null check (kind in ('customer', 'pro')),
  booking_id uuid references public.bookings (id) on delete set null,
  referrer_amount int not null,
  referee_amount int not null,
  created_at timestamptz not null default now()
);

create index referral_rewards_referrer_idx on public.referral_rewards (referrer, created_at desc);

alter table public.referral_rewards enable row level security;
create policy "own referral rewards" on public.referral_rewards for select using (
  referrer = (select auth.uid()) or referee = (select auth.uid()) or (select public.is_admin())
);
revoke all on public.referral_rewards from anon, authenticated;
grant select on public.referral_rewards to authenticated;
grant all on public.referral_rewards to service_role;

alter table public.bookings
  add column voucher_id uuid references public.vouchers (id) on delete set null,
  add column discount int not null default 0 check (discount >= 0);

-- Codes ------------------------------------------------------------------------

-- The caller's code, made the first time it is asked for.
create function public.my_referral_code() returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select referral_code into code from public.accounts where id = me;
  if code is not null then return code; end if;
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      update public.accounts set referral_code = code where id = me;
      return code;
    exception when unique_violation then
      -- Taken; draw again.
    end;
  end loop;
end $$;

-- Entering a friend's code. Returns the friend's display name.
create function public.claim_referral(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); mine public.accounts; inviter public.accounts; v_code text := upper(trim(coalesce(p_code, '')));
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  if not (select referral_enabled from public.platform_settings) then
    raise exception 'Chương trình giới thiệu đang tạm dừng.' using errcode = 'check_violation';
  end if;
  select * into mine from public.accounts where id = me for update;
  if mine.referred_by is not null then
    raise exception 'Bạn đã nhập mã giới thiệu rồi.' using errcode = 'check_violation';
  end if;
  if mine.created_at < now() - interval '30 days' then
    raise exception 'Mã giới thiệu chỉ dành cho tài khoản mới (trong 30 ngày đầu).' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.bookings where (customer_id = me or pro_id = me) and status = 'completed') then
    raise exception 'Mã giới thiệu chỉ dành cho người chưa dùng dịch vụ lần nào.' using errcode = 'check_violation';
  end if;
  select * into inviter from public.accounts where referral_code = v_code;
  if inviter is null then
    raise exception 'Mã giới thiệu không đúng.' using errcode = 'check_violation';
  end if;
  if inviter.id = me or inviter.referred_by = me then
    raise exception 'Không dùng được mã này.' using errcode = 'check_violation';
  end if;
  update public.accounts set referred_by = inviter.id, referred_at = now() where id = me;
  perform public.notify(inviter.id, 'referral_joined', 'Bạn bè đã nhập mã của bạn',
    'Khi họ dùng dịch vụ lần đầu, cả hai nhận ưu đãi.', '/gioi-thieu');
  return coalesce(nullif(inviter.full_name, ''), 'bạn của bạn');
end $$;

-- Rewards ------------------------------------------------------------------------

create function public.give_voucher(p_account uuid, p_amount int, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.platform_settings;
begin
  select * into s from public.platform_settings;
  insert into public.vouchers (account_id, amount, min_total, expires_at, note)
  values (p_account, p_amount, s.referral_min_total, now() + make_interval(days => s.voucher_days), p_note);
  perform public.notify(p_account, 'voucher_new',
    'Bạn nhận voucher ' || to_char(p_amount, 'FM999G999G999') || 'đ',
    'Dùng cho lịch hẹn từ ' || to_char(s.referral_min_total, 'FM999G999G999') || 'đ, hạn '
      || to_char((now() + make_interval(days => s.voucher_days)) at time zone public.app_timezone(), 'DD/MM') || '.',
    '/gioi-thieu');
end $$;

-- Pays one side: wallet credit to a freelancer, a voucher to anyone else.
create function public.pay_referral_side(p_account uuid, p_amount int, p_as_credit boolean, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_amount <= 0 then return; end if;
  if p_as_credit and exists (select 1 from public.pros where id = p_account) then
    insert into public.wallet_entries (pro_id, kind, amount, note) values (p_account, 'referral', p_amount, p_note);
    perform public.notify(p_account, 'referral_reward',
      'Ví được cộng ' || to_char(p_amount, 'FM999G999G999') || 'đ', p_note, '/studio/wallet');
  else
    perform public.give_voucher(p_account, p_amount, p_note);
  end if;
end $$;

-- After every completed booking: does it earn a referral reward?
create function public.check_referral(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.platform_settings; b public.bookings; acc public.accounts; month_count int; distinct_customers int;
begin
  select * into s from public.platform_settings;
  if not s.referral_enabled then return; end if;
  select * into b from public.bookings where id = p_booking;

  -- The customer side.
  select * into acc from public.accounts where id = b.customer_id;
  if acc.referred_by is not null and acc.referred_at > now() - interval '90 days'
     and not exists (select 1 from public.referral_rewards where referee = acc.id)
     and b.pro_id <> acc.referred_by
     and b.total >= s.referral_min_total then
    select count(*) into month_count from public.referral_rewards
      where referrer = acc.referred_by and created_at > date_trunc('month', now());
    if month_count < s.referral_monthly_cap then
      insert into public.referral_rewards (referee, referrer, kind, booking_id, referrer_amount, referee_amount)
      values (acc.id, acc.referred_by, 'customer', b.id, s.referral_customer_amount, s.referral_customer_amount);
      perform public.give_voucher(acc.referred_by, s.referral_customer_amount, 'Bạn bè bạn giới thiệu đã dùng dịch vụ lần đầu');
      perform public.give_voucher(acc.id, s.referral_customer_amount, 'Quà cho lần đầu dùng 360dep qua lời giới thiệu');
    end if;
  end if;

  -- The freelancer side.
  select * into acc from public.accounts where id = b.pro_id;
  if acc.referred_by is not null and acc.referred_at > now() - interval '90 days'
     and not exists (select 1 from public.referral_rewards where referee = acc.id) then
    select count(distinct customer_id) into distinct_customers from public.bookings
      where pro_id = acc.id and status = 'completed' and customer_id <> acc.referred_by;
    if distinct_customers >= 3 then
      select count(*) into month_count from public.referral_rewards
        where referrer = acc.referred_by and created_at > date_trunc('month', now());
      if month_count < s.referral_monthly_cap then
        insert into public.referral_rewards (referee, referrer, kind, booking_id, referrer_amount, referee_amount)
        values (acc.id, acc.referred_by, 'pro', b.id, s.referral_pro_amount, s.referral_pro_amount);
        perform public.pay_referral_side(acc.referred_by, s.referral_pro_amount, true, 'Người làm bạn giới thiệu đã xong 3 job');
        perform public.pay_referral_side(acc.id, s.referral_pro_amount, true, 'Quà giới thiệu: bạn đã xong 3 job đầu tiên');
      end if;
    end if;
  end if;
end $$;

-- Vouchers on bookings --------------------------------------------------------------

create function public.apply_voucher(p_booking uuid, p_voucher uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; v public.vouchers;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status not in ('pending', 'confirmed') or b.starts_at <= now() then
    raise exception 'Chỉ dùng voucher trước giờ hẹn.' using errcode = 'check_violation';
  end if;
  if b.voucher_id is not null then
    raise exception 'Lịch hẹn này đã dùng voucher.' using errcode = 'check_violation';
  end if;
  select * into v from public.vouchers where id = p_voucher for update;
  if v is null or v.account_id <> b.customer_id then
    raise exception 'Không tìm thấy voucher.' using errcode = 'no_data_found';
  end if;
  if v.booking_id is not null or v.used_at is not null then
    raise exception 'Voucher đã được dùng.' using errcode = 'check_violation';
  end if;
  if v.expires_at < now() then
    raise exception 'Voucher đã hết hạn.' using errcode = 'check_violation';
  end if;
  if b.total < v.min_total then
    raise exception 'Voucher dùng cho lịch hẹn từ %đ.', to_char(v.min_total, 'FM999G999G999') using errcode = 'check_violation';
  end if;
  update public.vouchers set booking_id = b.id where id = v.id;
  update public.bookings set voucher_id = v.id, discount = least(v.amount, b.total) where id = b.id;
  perform public.notify(b.pro_id, 'booking_voucher', 'Khách dùng voucher 360dep',
    'Khách trả bạn ' || to_char(b.total - least(v.amount, b.total), 'FM999G999G999') || 'đ; 360dep cộng '
      || to_char(least(v.amount, b.total), 'FM999G999G999') || 'đ vào ví khi job hoàn thành.',
    '/bookings/' || b.id);
end $$;

create function public.remove_voucher(p_booking uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.voucher_id is null then return; end if;
  if b.status not in ('pending', 'confirmed') or b.starts_at <= now() then
    raise exception 'Không bỏ voucher được sau giờ hẹn.' using errcode = 'check_violation';
  end if;
  update public.vouchers set booking_id = null where id = b.voucher_id;
  update public.bookings set voucher_id = null, discount = 0 where id = b.id;
end $$;

-- A booking's end settles its voucher and its referral.
create function public.booking_settle_extras() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if new.status = 'completed' then
    if new.voucher_id is not null and new.discount > 0 then
      update public.vouchers set used_at = now() where id = new.voucher_id;
      insert into public.wallet_entries (pro_id, booking_id, kind, amount, note)
      values (new.pro_id, new.id, 'voucher', new.discount, 'Voucher 360dep khách đã dùng')
      on conflict (booking_id, kind) do nothing;
    end if;
    perform public.check_referral(new.id);
  elsif new.status in ('cancelled', 'declined', 'expired', 'no_show') and new.voucher_id is not null then
    update public.vouchers set booking_id = null where id = new.voucher_id;
    update public.bookings set voucher_id = null, discount = 0 where id = new.id;
  end if;
  return new;
end $$;

create trigger bookings_settle_extras after update of status on public.bookings
  for each row execute function public.booking_settle_extras();

revoke all on function
  public.my_referral_code(),
  public.claim_referral(text),
  public.give_voucher(uuid, int, text),
  public.pay_referral_side(uuid, int, boolean, text),
  public.check_referral(uuid),
  public.apply_voucher(uuid, uuid),
  public.remove_voucher(uuid),
  public.booking_settle_extras()
from public, anon, authenticated;
grant execute on function
  public.my_referral_code(),
  public.claim_referral(text),
  public.apply_voucher(uuid, uuid),
  public.remove_voucher(uuid)
to authenticated;
