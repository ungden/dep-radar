-- What each trade needs on a profile beyond the beauty fields.
--
-- Photo & video: the equipment. "iPhone 16 Pro Max" or "Sony A7 IV" is the first
-- thing a customer asks, and it is a fair filter.
--
-- Models: what a client needs to cast someone. Height, clothing and shoe sizes,
-- styles, and what they will and will not do. Body measurements are deliberately
-- not collected: nobody needs them to book, and they are the data most often
-- abused on casting boards.

alter table public.pros
  add column equipment text check (char_length(equipment) <= 200);

-- The column grant list from 20260922092824 is what a freelancer may edit.
grant update (equipment) on public.pros to authenticated;

create table public.model_profiles (
  pro_id uuid primary key references public.pros (id) on delete cascade,
  height_cm int check (height_cm between 120 and 220),
  top_size text not null default '' check (char_length(top_size) <= 20),
  bottom_size text not null default '' check (char_length(bottom_size) <= 20),
  shoe_size text not null default '' check (char_length(shoe_size) <= 20),
  styles text[] not null default '{}' check (cardinality(styles) <= 12),
  accepts text[] not null default '{}' check (cardinality(accepts) <= 12),
  refuses text[] not null default '{}' check (cardinality(refuses) <= 12),
  updated_at timestamptz not null default now()
);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger model_profiles_touch
  before insert or update on public.model_profiles
  for each row execute function public.touch_updated_at();

alter table public.model_profiles enable row level security;

-- Public exactly when the profile it belongs to is.
create policy "model profiles follow their profile" on public.model_profiles for select using (
  pro_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.pros p
    where p.id = model_profiles.pro_id and p.published and p.suspended_at is null
  )
);
create policy "model writes own profile" on public.model_profiles
  for insert with check (pro_id = (select auth.uid()));
create policy "model edits own profile" on public.model_profiles
  for update using (pro_id = (select auth.uid())) with check (pro_id = (select auth.uid()));
create policy "model removes own profile" on public.model_profiles
  for delete using (pro_id = (select auth.uid()));

-- Spelled out rather than inherited from whatever the default privileges are.
revoke all on public.model_profiles from anon, authenticated;
grant select on public.model_profiles to anon, authenticated;
grant insert, update, delete on public.model_profiles to authenticated;
grant all on public.model_profiles to service_role;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
