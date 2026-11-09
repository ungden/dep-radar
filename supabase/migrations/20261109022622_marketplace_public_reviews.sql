-- Completed bookings can publish customer reviews immediately. Pending historical reviews keep their existing expiry.
create or replace function public.write_review(
  p_booking uuid, p_rating int, p_tags text[], p_body text, p_photo_paths text[] default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; who text; label text; existing public.reviews;
begin
  perform 1 from public.bookings where id = p_booking for update;
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá được job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  if not public.review_window_open(b) then
    raise exception 'Đã quá 14 ngày kể từ khi hoàn thành, không thể đánh giá nữa.' using errcode = 'check_violation';
  end if;
  select * into existing from public.reviews where booking_id = p_booking;
  if existing.published_at is not null then
    raise exception 'Đánh giá đã hiện công khai, không sửa được nữa.' using errcode = 'check_violation';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Chọn từ 1 đến 5 sao.' using errcode = 'check_violation';
  end if;
  if not public.review_tags_ok(p_rating, p_tags) then
    raise exception 'Từ 3 sao trở xuống, chọn ít nhất một điều chưa tốt.' using errcode = 'check_violation';
  end if;
  if public.banned_content(p_body) then
    raise exception 'Nội dung đánh giá có từ không phù hợp. Vui lòng chỉnh lại rồi gửi.' using errcode = 'check_violation';
  end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = b.customer_id;
  select trim(both ' · ' from coalesce(t.name, '') || ' · ' || coalesce(v.label, '')) into label
    from public.service_templates t
    left join public.service_variants v on v.template_id = b.template_id and v.id = b.variant_id
    where t.id = b.template_id;

  insert into public.reviews (booking_id, pro_id, customer_id, author_name, service_label,
                              rating, tags, body, photo_paths, published_at)
  values (p_booking, b.pro_id, b.customer_id, who, coalesce(label, ''),
          p_rating, coalesce(p_tags, '{}'), p_body, coalesce(p_photo_paths, '{}'), null)
  on conflict (booking_id) do update
    set rating = excluded.rating, tags = excluded.tags, body = excluded.body,
        photo_paths = excluded.photo_paths;

  -- Publish the customer's review alone; the reciprocal review stays private.
  update public.reviews set published_at = now() where booking_id = p_booking;
  perform public.refresh_pro_rating(b.pro_id);
  perform public.notify(b.pro_id, 'review_new', 'Có đánh giá mới', 'Xem và trả lời trên hồ sơ của bạn.', '/bookings/' || p_booking);
end $$;
