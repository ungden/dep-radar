-- "Bạn quan tâm gì?" asked once after the first sign-in: the first real signal the
-- feed has about a person. A handful of categories, nothing inferred.

alter table public.accounts
  add column interests public.category_id[] not null default '{}' check (cardinality(interests) <= 6);

-- Through a function rather than a column grant, so the limit and the de-duplication
-- live in one place and the message is a sentence.
create function public.set_interests(p_categories public.category_id[]) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); picked public.category_id[];
begin
  if me is null then raise exception 'Cần đăng nhập.' using errcode = 'insufficient_privilege'; end if;
  select coalesce(array_agg(distinct c), '{}') into picked from unnest(coalesce(p_categories, '{}')) c where c is not null;
  if cardinality(picked) > 6 then
    raise exception 'Chọn tối đa 6 mục.' using errcode = 'check_violation';
  end if;
  update public.accounts set interests = picked where id = me;
end $$;

revoke all on function public.set_interests(public.category_id[]) from public, anon, authenticated;
grant execute on function public.set_interests(public.category_id[]) to authenticated;
