-- Casting calls ("Tuyển mẫu"): the request board turned around.
--
-- A freelancer needs a model -- hands to practise a nail design on, a face for a
-- makeup portfolio, someone to wear a shop's collection. They post a call; people
-- apply; the freelancer picks. The model is paid in kind (a free or discounted
-- service) or in money.
--
-- Rules, all enforced here:
--  * Only a published freelancer posts, and only for work they do (or for a
--    model, which is the point of a photographer's call).
--  * A paid call, and any call in a model category, needs the poster's identity
--    verified: that is where casting scams live.
--  * The content filter (20260923100300) runs on every call.
--  * Nobody applies without a phone number on the account, as with bookings.
--  * Accepting stops at the number of models wanted, and an accepted applicant
--    gets a chat with the poster so the two can arrange the details.
--  * Calls close themselves once their time has passed.

create table public.castings (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros (id) on delete cascade,
  category public.category_id not null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  starts_at timestamptz not null,
  city text not null,
  district text not null,
  slots int not null default 1 check (slots between 1 and 10),
  compensation text not null check (compensation in ('free', 'discount', 'paid')),
  discount_percent int check (discount_percent between 10 and 100),
  fee int check (fee > 0 and fee % 5000 = 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  -- Kept by the functions below, so a visitor can see "2/3 đã nhận" without
  -- being able to read anyone's application.
  accepted_count int not null default 0 check (accepted_count >= 0 and accepted_count <= slots),
  created_at timestamptz not null default now(),
  check ((compensation = 'discount') = (discount_percent is not null)),
  check ((compensation = 'paid') = (fee is not null))
);

create index castings_open_idx on public.castings (city, starts_at) where status = 'open';
create index castings_pro_idx on public.castings (pro_id, created_at desc);

create table public.casting_applications (
  id uuid primary key default gen_random_uuid(),
  casting_id uuid not null references public.castings (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  -- Snapshotted like threads.customer_name: the poster may see a name, but the
  -- account row also holds a phone number and an application does not entitle
  -- anyone to that.
  applicant_name text not null default 'Người ứng tuyển',
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (casting_id, account_id)
);

create index casting_applications_account_idx on public.casting_applications (account_id, created_at desc);

create trigger castings_banned_content
  before insert or update of title, description on public.castings
  for each row execute function public.refuse_banned_content();

-- require_phone() learns the applicant's column. Same body as 20260922105807
-- otherwise: bookings and jobs name the customer, a pros row is the account.
create or replace function public.require_phone() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(new);
  who uuid := coalesce((r ->> 'customer_id')::uuid, (r ->> 'account_id')::uuid, (r ->> 'id')::uuid);
begin
  if exists (select 1 from public.accounts a where a.id = who and a.phone = '') then
    raise exception 'Cần thêm số điện thoại vào tài khoản trước.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger casting_applications_require_phone before insert on public.casting_applications
  for each row execute function public.require_phone();

-- Row level security ------------------------------------------------------------

alter table public.castings enable row level security;
alter table public.casting_applications enable row level security;

-- Lets an applicant keep seeing a call after it closes. A definer function
-- rather than a join, because the applications policy below reads castings and
-- two policies reading each other is infinite recursion.
create function public.applied_to_casting(p_casting uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.casting_applications a
    where a.casting_id = p_casting and a.account_id = auth.uid()
  )
$$;

create policy "open castings are public" on public.castings for select using (
  pro_id = (select auth.uid())
  or public.is_admin()
  or (
    status = 'open'
    and exists (
      select 1 from public.pros p
      where p.id = castings.pro_id and p.published and p.suspended_at is null
    )
  )
  or public.applied_to_casting(id)
);

create policy "applicant and poster read applications" on public.casting_applications for select using (
  account_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.castings c
    where c.id = casting_applications.casting_id and c.pro_id = (select auth.uid())
  )
);
-- No write policies: every change is one of the functions below.

revoke all on public.castings, public.casting_applications from anon, authenticated;
grant select on public.castings, public.casting_applications to anon, authenticated;
grant all on public.castings, public.casting_applications to service_role;

-- Posting -----------------------------------------------------------------------

create function public.create_casting(
  p_category public.category_id,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_city text,
  p_district text,
  p_slots int,
  p_compensation text,
  p_discount_percent int default null,
  p_fee int default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); pro public.pros; new_id uuid; v_title text := trim(coalesce(p_title, ''));
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into pro from public.pros where id = me;
  if pro is null then
    raise exception 'Chỉ chuyên viên mới đăng tuyển mẫu được.' using errcode = 'insufficient_privilege';
  end if;
  if pro.suspended_at is not null then
    raise exception 'Hồ sơ của bạn đang tạm khoá.' using errcode = 'check_violation';
  end if;
  if not pro.published then
    raise exception 'Cần mở hồ sơ trước khi đăng tuyển mẫu.' using errcode = 'check_violation';
  end if;
  if p_category is null or not (p_category = any (pro.categories) or p_category::text like 'model-%') then
    raise exception 'Chỉ tuyển mẫu cho dịch vụ bạn đã khai trong hồ sơ.' using errcode = 'check_violation';
  end if;
  if (p_compensation = 'paid' or p_category::text like 'model-%') and pro.identity_status <> 'verified' then
    raise exception 'Tuyển mẫu có thù lao hoặc tuyển người mẫu chỉ mở cho tài khoản đã xác minh danh tính.'
      using errcode = 'check_violation';
  end if;
  if p_starts_at is null or p_starts_at <= now() or p_starts_at > now() + interval '90 days' then
    raise exception 'Thời gian cần mẫu phải trong vòng 90 ngày tới.' using errcode = 'check_violation';
  end if;
  if char_length(v_title) not between 5 and 120 then
    raise exception 'Tiêu đề cần từ 5 đến 120 ký tự.' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(p_description, '')) > 2000 then
    raise exception 'Mô tả tối đa 2000 ký tự.' using errcode = 'check_violation';
  end if;
  if p_slots is null or p_slots not between 1 and 10 then
    raise exception 'Số mẫu cần tuyển từ 1 đến 10.' using errcode = 'check_violation';
  end if;
  if p_compensation = 'discount' and (p_discount_percent is null or p_discount_percent not between 10 and 100) then
    raise exception 'Mức giảm giá từ 10%% đến 100%%.' using errcode = 'check_violation';
  elsif p_compensation = 'paid' and (p_fee is null or p_fee <= 0 or p_fee % 5000 <> 0) then
    raise exception 'Thù lao phải là bội số của 5.000đ.' using errcode = 'check_violation';
  elsif p_compensation is null or p_compensation not in ('free', 'discount', 'paid') then
    raise exception 'Hình thức đãi ngộ không hợp lệ.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.districts d where d.city = p_city and d.district = p_district) then
    raise exception 'Khu vực không hợp lệ.' using errcode = 'check_violation';
  end if;
  -- A board full of one person's calls is spam, whatever the calls say.
  if (select count(*) from public.castings where pro_id = me and status = 'open') >= 5 then
    raise exception 'Bạn đang có 5 tin tuyển mẫu mở. Đóng bớt rồi đăng tiếp nhé.' using errcode = 'check_violation';
  end if;

  insert into public.castings (pro_id, category, title, description, starts_at, city, district, slots,
                               compensation, discount_percent, fee)
  values (me, p_category, v_title, trim(coalesce(p_description, '')), p_starts_at, p_city, p_district, p_slots,
          p_compensation,
          case when p_compensation = 'discount' then p_discount_percent end,
          case when p_compensation = 'paid' then p_fee end)
  returning id into new_id;
  return new_id;
end $$;

create function public.close_casting(p_casting uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.castings;
begin
  select * into c from public.castings where id = p_casting for update;
  if c is null then raise exception 'Không tìm thấy tin tuyển mẫu.' using errcode = 'no_data_found'; end if;
  if c.pro_id is distinct from auth.uid() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  update public.castings set status = 'closed' where id = c.id and status = 'open';
end $$;

-- Applying ----------------------------------------------------------------------

create function public.apply_casting(p_casting uuid, p_message text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); c public.castings; a public.casting_applications; who text; new_id uuid;
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select * into c from public.castings where id = p_casting for update;
  if c is null then raise exception 'Không tìm thấy tin tuyển mẫu.' using errcode = 'no_data_found'; end if;
  if c.pro_id = me then
    raise exception 'Không thể ứng tuyển tin của chính mình.' using errcode = 'check_violation';
  end if;
  if c.status <> 'open' or c.starts_at <= now() then
    raise exception 'Tin tuyển mẫu đã đóng.' using errcode = 'check_violation';
  end if;
  if c.accepted_count >= c.slots then
    raise exception 'Tin này đã đủ mẫu.' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(p_message, '')) > 1000 then
    raise exception 'Lời nhắn tối đa 1000 ký tự.' using errcode = 'check_violation';
  end if;

  select * into a from public.casting_applications where casting_id = c.id and account_id = me for update;
  -- `a is not null` would be false for a found row with any null column.
  if a.id is not null and a.status <> 'withdrawn' then
    raise exception 'Bạn đã ứng tuyển tin này rồi.' using errcode = 'check_violation';
  end if;

  if a.id is not null then
    -- Changed their mind back: the same row, a fresh place in the queue.
    update public.casting_applications
      set status = 'pending', message = trim(coalesce(p_message, '')), created_at = now(), decided_at = null
      where id = a.id;
    new_id := a.id;
  else
    select coalesce(nullif(full_name, ''), 'Người ứng tuyển') into who from public.accounts where id = me;
    insert into public.casting_applications (casting_id, account_id, applicant_name, message)
    values (c.id, me, who, trim(coalesce(p_message, '')))
    returning id into new_id;
  end if;

  perform public.notify(c.pro_id, 'casting_application', 'Có người ứng tuyển làm mẫu', c.title,
    '/tuyen-mau/' || c.id);
  return new_id;
end $$;

create function public.withdraw_application(p_application uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.casting_applications; c public.castings;
begin
  select * into a from public.casting_applications where id = p_application;
  if a is null or a.account_id is distinct from auth.uid() then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  -- Casting first, then the application: the same order decide_application() uses.
  select * into c from public.castings where id = a.casting_id for update;
  select * into a from public.casting_applications where id = p_application for update;
  if a.status not in ('pending', 'accepted') then
    raise exception 'Đơn ứng tuyển không còn hiệu lực.' using errcode = 'check_violation';
  end if;
  update public.casting_applications set status = 'withdrawn', decided_at = now() where id = a.id;
  if a.status = 'accepted' then
    update public.castings set accepted_count = accepted_count - 1 where id = c.id;
    perform public.notify(c.pro_id, 'casting_withdrawn', 'Một mẫu đã rút khỏi tin tuyển', c.title,
      '/tuyen-mau/' || c.id);
  end if;
end $$;

-- Returns the chat thread with the applicant when accepted, null otherwise.
create function public.decide_application(p_application uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); a public.casting_applications; c public.castings; thread uuid;
begin
  select * into a from public.casting_applications where id = p_application;
  if a is null then raise exception 'Không tìm thấy đơn ứng tuyển.' using errcode = 'no_data_found'; end if;
  -- Lock the call: two accepts at once must not both fit into the last slot.
  select * into c from public.castings where id = a.casting_id for update;
  if c.pro_id is distinct from me then
    raise exception 'Không có quyền.' using errcode = 'insufficient_privilege';
  end if;
  select * into a from public.casting_applications where id = p_application for update;
  if a.status <> 'pending' then
    raise exception 'Đơn này đã được xử lý.' using errcode = 'check_violation';
  end if;

  if not coalesce(p_accept, false) then
    update public.casting_applications set status = 'rejected', decided_at = now() where id = a.id;
    perform public.notify(a.account_id, 'casting_rejected', 'Tin tuyển mẫu: chưa phù hợp lần này',
      c.title, '/tuyen-mau/' || c.id);
    return null;
  end if;

  if c.status <> 'open' or c.starts_at <= now() then
    raise exception 'Tin tuyển mẫu đã đóng.' using errcode = 'check_violation';
  end if;
  if c.accepted_count >= c.slots then
    raise exception 'Đã đủ số mẫu cần tuyển.' using errcode = 'check_violation';
  end if;
  update public.casting_applications set status = 'accepted', decided_at = now() where id = a.id;
  update public.castings set accepted_count = accepted_count + 1 where id = c.id;

  -- The two need to talk: the general thread between them (no booking), opened
  -- if there is none, with a first message so it shows in both inboxes.
  select id into thread from public.threads
    where customer_id = a.account_id and pro_id = c.pro_id and booking_id is null;
  if thread is null then
    insert into public.threads (customer_id, pro_id, booking_id, customer_name)
    values (a.account_id, c.pro_id, null, a.applicant_name)
    returning id into thread;
  end if;
  insert into public.messages (thread_id, sender_id, body)
  values (thread, me, format('Chào %s, mình đã chọn bạn làm mẫu cho "%s" lúc %s. Mình nhắn để hẹn chi tiết nhé.',
    a.applicant_name, c.title, to_char(c.starts_at at time zone public.app_timezone(), 'HH24:MI DD/MM')));

  perform public.notify(a.account_id, 'casting_accepted', 'Bạn đã được chọn làm mẫu', c.title,
    '/tin-nhan/' || thread);
  return thread;
end $$;

-- Maintenance -------------------------------------------------------------------

-- Same as 20260918040500, plus casting calls whose time has passed. That runs
-- every fifteen minutes already, and a call is a request in the other direction.
create or replace function public.expire_stale_jobs() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with done as (
    update public.jobs set status = 'expired'
      where status = 'open' and starts_at < now()
      returning id
  )
  select count(*) into n from done;
  update public.offers set status = 'rejected'
    where status = 'pending' and (expires_at < now()
      or job_id in (select id from public.jobs where status <> 'open'));
  update public.castings set status = 'closed' where status = 'open' and starts_at < now();
  return n;
end $$;

-- Privileges --------------------------------------------------------------------

revoke all on function
  public.require_phone(),
  public.applied_to_casting(uuid),
  public.create_casting(public.category_id, text, text, timestamptz, text, text, int, text, int, int),
  public.close_casting(uuid),
  public.apply_casting(uuid, text),
  public.withdraw_application(uuid),
  public.decide_application(uuid, boolean),
  public.expire_stale_jobs()
from public, anon, authenticated;

-- A row level security policy calls it, so every caller needs EXECUTE.
grant execute on function public.applied_to_casting(uuid) to anon, authenticated;

grant execute on function
  public.create_casting(public.category_id, text, text, timestamptz, text, text, int, text, int, int),
  public.close_casting(uuid),
  public.apply_casting(uuid, text),
  public.withdraw_application(uuid),
  public.decide_application(uuid, boolean)
to authenticated;
