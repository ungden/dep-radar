-- Reviews are public, but the service they were for was read by joining
-- `bookings`, which is private -- so an anonymous visitor got an empty list and
-- the profile showed a rating with no reviews under it. The same mistake as the
-- display name: a public thing must not depend on a private table.
--
-- The label is snapshotted at write time. That is also more correct: it records
-- what was booked then, not what the listing is called now.

alter table public.reviews add column service_label text not null default '';

update public.reviews r
set service_label = trim(both ' · ' from coalesce(t.name, '') || ' · ' || coalesce(v.label, ''))
from public.bookings b
left join public.service_templates t on t.id = b.template_id
left join public.service_variants v on v.template_id = b.template_id and v.id = b.variant_id
where b.id = r.booking_id;

create or replace function public.write_review(
  p_booking uuid, p_rating int, p_tags text[], p_body text, p_photo_paths text[] default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.bookings; who text; label text;
begin
  b := public.booking_for_caller(p_booking, 'customer');
  if b.status <> 'completed' then
    raise exception 'Chỉ đánh giá được job đã hoàn thành.' using errcode = 'check_violation';
  end if;
  select coalesce(nullif(full_name, ''), 'Khách hàng') into who from public.accounts where id = b.customer_id;
  select trim(both ' · ' from coalesce(t.name, '') || ' · ' || coalesce(v.label, '')) into label
    from public.service_templates t
    left join public.service_variants v on v.template_id = b.template_id and v.id = b.variant_id
    where t.id = b.template_id;

  insert into public.reviews (booking_id, pro_id, customer_id, author_name, service_label,
                              rating, tags, body, photo_paths)
  values (p_booking, b.pro_id, b.customer_id, who, coalesce(label, ''),
          p_rating, coalesce(p_tags, '{}'), p_body, coalesce(p_photo_paths, '{}'))
  on conflict (booking_id) do update
    set rating = excluded.rating, tags = excluded.tags, body = excluded.body,
        photo_paths = excluded.photo_paths, created_at = now();
  perform public.refresh_pro_rating(b.pro_id);
  perform public.notify(b.pro_id, 'review_new', 'Bạn có đánh giá mới', '', '/pros/' || b.pro_id);
end $$;
