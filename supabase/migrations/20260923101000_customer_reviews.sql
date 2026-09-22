-- Reviews in the other direction: the freelancer rates the customer.
--
-- A freelancer going to a stranger's home, or a model going to a stranger's
-- shoot, deserves what the customer already has: other people's experience of
-- the person before saying yes. So these are readable by any freelancer (who
-- may be about to accept this customer) and by the customer they are about --
-- never by the public, because a customer is a private person, not a listing.

create table public.customer_reviews (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  pro_id uuid not null references public.pros (id) on delete cascade,
  customer_id uuid not null references public.accounts (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create index customer_reviews_customer_idx on public.customer_reviews (customer_id, created_at desc);
create index customer_reviews_pro_idx on public.customer_reviews (pro_id);

alter table public.customer_reviews enable row level security;

create policy "customer reviews are for pros and their subject" on public.customer_reviews for select using (
  customer_id = (select auth.uid()) or public.is_pro() or public.is_admin()
);
-- Written through review_customer() only.

revoke all on public.customer_reviews from anon, authenticated;
grant select on public.customer_reviews to authenticated;
grant all on public.customer_reviews to service_role;

-- Once per booking, and only after the job actually happened. Unlike the
-- customer's review it cannot be rewritten: a rating a freelancer can revise
-- after an argument is a lever, not a record.
create function public.review_customer(p_booking uuid, p_rating int, p_body text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  b := public.booking_for_caller(p_booking, 'pro');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá khách sau khi job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Chọn từ 1 đến 5 sao.' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(p_body, '')) > 1000 then
    raise exception 'Nhận xét tối đa 1000 ký tự.' using errcode = 'check_violation';
  end if;
  insert into public.customer_reviews (booking_id, pro_id, customer_id, rating, body)
  values (b.id, b.pro_id, b.customer_id, p_rating, trim(coalesce(p_body, '')));
exception when unique_violation then
  raise exception 'Bạn đã đánh giá khách của lịch hẹn này.' using errcode = 'check_violation';
end $$;

revoke all on function public.review_customer(uuid, int, text) from public, anon, authenticated;
grant execute on function public.review_customer(uuid, int, text) to authenticated;
