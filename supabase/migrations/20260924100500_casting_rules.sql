-- Casting calls, tightened after review.
--
-- 1. Every call needs a verified poster. The first rules let an unverified
--    freelancer post a free call for their own trade, on the thinking that
--    "hands for a gel set" is harmless. It is also the easiest way to meet a
--    stranger without anyone knowing who you are, which is what the badge is for.
-- 2. A paid call also needs the poster to be 18 or over (20260924100100): money
--    changing hands for someone's time is a contract, and a minor cannot be the
--    one offering it.
-- 3. The cap counts calls *created* in the last 7 days, not calls open right now.
--    Counting open ones meant close, post, close, post: five at a time, forever.
-- 4. The poster hears about an applicant once. Withdrawing and re-applying used
--    to notify every time, which made re-applying a way to spam someone's inbox.

-- Same as 20260923100900, with rules 1-3.
create or replace function public.create_casting(
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
  -- Locked: two posts at once must not both slip under the weekly cap.
  select * into pro from public.pros where id = me for update;
  if pro is null then
    raise exception 'Chỉ chuyên viên mới đăng tuyển mẫu được.' using errcode = 'insufficient_privilege';
  end if;
  if pro.suspended_at is not null then
    raise exception 'Hồ sơ của bạn đang tạm khoá.' using errcode = 'check_violation';
  end if;
  if not pro.published then
    raise exception 'Cần mở hồ sơ trước khi đăng tuyển mẫu.' using errcode = 'check_violation';
  end if;
  if pro.identity_status <> 'verified' then
    raise exception 'Tuyển mẫu chỉ mở cho tài khoản đã xác minh danh tính.' using errcode = 'check_violation';
  end if;
  if p_compensation = 'paid' and not coalesce(pro.adult, false) then
    raise exception 'Tin tuyển mẫu có thù lao chỉ dành cho tài khoản đã xác minh và đủ 18 tuổi.'
      using errcode = 'check_violation';
  end if;
  if p_category is null or not (p_category = any (pro.categories) or p_category::text like 'model-%') then
    raise exception 'Chỉ tuyển mẫu cho dịch vụ bạn đã khai trong hồ sơ.' using errcode = 'check_violation';
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
  -- A board full of one person's calls is spam, whatever the calls say. Closed
  -- calls count too, or closing one would make room for the next.
  if (select count(*) from public.castings where pro_id = me and created_at > now() - interval '7 days') >= 5 then
    raise exception 'Mỗi tuần đăng tối đa 5 tin tuyển mẫu. Thử lại sau vài ngày nhé.' using errcode = 'check_violation';
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

-- Same as 20260923100900, with rule 4.
create or replace function public.apply_casting(p_casting uuid, p_message text default '') returns uuid
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
    -- Changed their mind back: the same row, a fresh place in the queue, and no
    -- second notification -- the poster already heard about this person.
    update public.casting_applications
      set status = 'pending', message = trim(coalesce(p_message, '')), created_at = now(), decided_at = null
      where id = a.id;
    return a.id;
  end if;

  select coalesce(nullif(full_name, ''), 'Người ứng tuyển') into who from public.accounts where id = me;
  insert into public.casting_applications (casting_id, account_id, applicant_name, message)
  values (c.id, me, who, trim(coalesce(p_message, '')))
  returning id into new_id;

  perform public.notify(c.pro_id, 'casting_application', 'Có người ứng tuyển làm mẫu', c.title,
    '/tuyen-mau/' || c.id);
  return new_id;
end $$;

revoke all on function
  public.create_casting(public.category_id, text, text, timestamptz, text, text, int, text, int, int),
  public.apply_casting(uuid, text)
from public, anon, authenticated;
grant execute on function
  public.create_casting(public.category_id, text, text, timestamptz, text, text, int, text, int, int),
  public.apply_casting(uuid, text)
to authenticated;
