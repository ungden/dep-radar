-- Run in a disposable PostgreSQL database, within the surrounding transaction.
-- Models existing RPC dependencies; exercises the new SQL implementation itself.
begin;
set local timezone = 'UTC';
do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;end$$;
create schema auth; create schema partner_private; grant usage on schema auth to authenticated,anon; grant usage on schema partner_private to authenticated;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create type public.payment_method as enum ('cash','online');
create table public.service_templates(id text primary key,category text,name text,description text,includes text[],studio_only boolean,on_location boolean,deliverable text,delivery_days int,requires_verification boolean,addon_only boolean,active boolean,sort_order int,catalog_version int);
create table public.service_variants(template_id text,id text,label text,duration_min int,min_price int,max_price int,suggested_price int,price_tiers int[],per_person boolean,max_quantity int,sort_order int,duration_rule text,min_quantity int,deliverable text,revisions int,sessions int,followup_days int,primary key(template_id,id));
create table public.pros(id uuid primary key,lat double precision,lng double precision,buffer_min int);
create table public.addresses(id uuid primary key,account_id uuid,lat double precision,lng double precision);
create table public.fee_policy(id boolean,road_factor numeric);
create table public.bookings(id uuid primary key default gen_random_uuid(),template_id text,variant_id text,quantity int,customer_id uuid,pro_id uuid,starts_at timestamptz,duration_min int,buffer_min int,status text,blocked_range tstzrange,service_contract jsonb,service_price int,travel_fee int,urgent_fee int,commission_rate numeric,commission int,observed_commission int,usage_scope text,consent_repost boolean);
create table public.jobs(template_id text);
create table public.booking_sessions(booking_id uuid,pro_id uuid,sequence int,starts_at timestamptz,duration_min int,confirmed boolean);
create type public.quote as (service_price int,distance_km numeric,travel_fee int,urgent_fee int,total int,commission_rate numeric,commission int,payout int);
create function public.build_quote(p int,n int,h boolean,k numeric,u boolean) returns public.quote language sql as $$ select (p*n,k,case when h then 50000 else 0 end,case when u then 50000 else 0 end,p*n+case when h then 50000 else 0 end+case when u then 50000 else 0 end,0.2,round(p*n*0.2/1000)::int*1000,p*n-round(p*n*0.2/1000)::int*1000+case when h then 50000 else 0 end+case when u then 50000 else 0 end)::public.quote $$;
create function public.listed_price(p uuid,t text,v text) returns int language sql as $$select suggested_price from public.service_variants where template_id=t and id=v$$;
create function public.service_duration_min(t text,v text,n int) returns int language sql as $$select duration_min*case when duration_rule='per_person' then n else 1 end from public.service_variants where template_id=t and id=v$$;
create function public.within_working_hours(p uuid,a timestamptz,m int) returns boolean language sql as $$select extract(hour from a at time zone 'UTC')*60+extract(minute from a)+m<=1200$$;
create function public.availability_problem(p uuid,t text,v text,n int,a timestamptz,h boolean,lat double precision,lng double precision) returns text language sql as $$select null::text$$;
create function public.travel_distance_km(a double precision,b double precision,c double precision,d double precision,e numeric) returns numeric language sql as $$select 2::numeric$$;
create function public.is_urgent(a timestamptz) returns boolean language sql as $$select false$$;
create function public.free_slots(p uuid,t text,v text,n int,d date,h boolean,lat double precision,lng double precision) returns setof timestamptz language sql as $$select (d+time '18:00')::timestamptz union all select (d+time '19:00')::timestamptz$$;
create function partner_private.service_contract(t text,v text,n int,u int,m int) returns jsonb language sql as $$select jsonb_build_object('includes',s.includes,'serviceName',s.name,'variantLabel',v,'quantity',n,'durationMin',m,'sessions',o.sessions,'deliveryDays',o.followup_days) from public.service_templates s join public.service_variants o on o.template_id=s.id where s.id=t and o.id=v$$;
create function partner_private.capture_service_contract() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' then
    new.service_contract:=old.service_contract;
    if tg_table_name='jobs' then new.max_total:=old.max_total; end if;
    return new;
  end if;
  if tg_table_name='bookings' then
    perform pg_advisory_xact_lock(hashtextextended(new.pro_id::text,1));
    if (select sessions>1 from public.service_variants where template_id=new.template_id and id=new.variant_id) and coalesce(current_setting('app.checked_booking',true),'')<>'on' then raise exception 'Chọn đủ các buổi qua luồng đặt lịch mới.'; end if;
    new.service_contract:=partner_private.service_contract(new.template_id,new.variant_id,new.quantity,
      new.service_price/greatest(new.quantity,1),new.duration_min);
  else
    new.service_contract:=partner_private.service_contract(new.template_id,new.variant_id,new.quantity,new.price,
      public.service_duration_min(new.template_id,new.variant_id,new.quantity));
    new.max_total:=coalesce(nullif(current_setting('app.job_max_total',true),'')::int,
      new.price*new.quantity+(select travel_fee_cap+case when public.is_urgent(new.starts_at) then urgent_fee else 0 end from public.fee_policy where id));
    if new.max_total<new.price*new.quantity then raise exception 'Tổng tối đa không được thấp hơn giá dịch vụ.'; end if;
  end if;
  return new;
end $$;
create trigger aa_contract before insert or update on public.bookings for each row execute function partner_private.capture_service_contract();
create function partner_private.booking_quote(p uuid,t text,v text,a timestamptz,h boolean,ad uuid,n int) returns jsonb language sql as $$select jsonb_build_object('total',public.listed_price(p,t,v)*n+50000,'unitPrice',public.listed_price(p,t,v))$$;
create function partner_private.create_booking_checked(p uuid,t text,v text,a timestamptz,h boolean,ad uuid,n int,note text,pay public.payment_method,expected int,unit int,sessions timestamptz[]) returns uuid language plpgsql as $$declare bid uuid;begin insert into public.bookings(template_id,variant_id,quantity,customer_id,pro_id,starts_at,duration_min,buffer_min,status,service_contract,service_price) values(t,v,n,auth.uid(),p,a,public.service_duration_min(t,v,n),15,'pending',partner_private.service_contract(t,v,n,unit,public.service_duration_min(t,v,n)),unit*n) returning id into bid;return bid;end$$;
create function public.set_booking_references(b uuid,paths text[]) returns void language plpgsql as $$begin if cardinality(paths)>3 then raise exception 'too many references';end if;end$$;
create function partner_private.observe_insert_commission() returns trigger language plpgsql as $$begin new.observed_commission:=new.commission;return new;end$$;
create trigger mcn_snapshot_fixture before insert on public.bookings for each row execute function partner_private.observe_insert_commission();
\ir ../migrations/20261028140004_service_cart_atomic.sql
insert into public.pros values('00000000-0000-0000-0000-000000000001',10,106,15);
insert into public.addresses values('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003',10,106);
insert into public.fee_policy values(true,1.2);
select set_config('test.uid','00000000-0000-0000-0000-000000000003',true);
do $$declare q jsonb; bid uuid; items jsonb:='[{"template":"nail-pilot","variant":"gel","quantity":1},{"template":"nail-art-pilot","variant":"simple","quantity":2}]';begin
 q:=public.cart_quote('00000000-0000-0000-0000-000000000001',items,'2030-01-01 10:00Z',true,'00000000-0000-0000-0000-000000000002');
 assert (q->>'servicePrice')::int=170000,'all lines priced'; assert (q->>'total')::int=220000,'one travel fee'; assert (q->>'durationMin')::int=75,'whole duration';
 bid:=public.create_cart_booking((q->>'quoteId')::uuid,'','cash','{}','commercial',false);
 assert (select service_price=170000 and observed_commission=34000 and duration_min=75 and usage_scope='commercial' and jsonb_array_length(service_contract->'lines')=2 from public.bookings where id=bid),'aggregate contract';
 assert public.create_cart_booking((q->>'quoteId')::uuid)=bid,'idempotency';
 assert (select count(*)=1 from public.bookings),'no child orders';
 assert cardinality(public.cart_slots('00000000-0000-0000-0000-000000000001',items,'2030-01-02',true,10,106))=1,'exclude late slot for full cart';
 begin perform public.cart_quote('00000000-0000-0000-0000-000000000001','[{"template":"nail-gel","variant":"hand","quantity":1},{"template":"nail-gel","variant":"hand-foot","quantity":1}]','2030-01-01 10:00Z',true,'00000000-0000-0000-0000-000000000002'); raise exception 'duplicate accepted'; exception when raise_exception then if sqlerrm='duplicate accepted' then raise;end if;end;
 begin perform public.cart_quote('00000000-0000-0000-0000-000000000001','[{"template":"nail-design","variant":"stone","quantity":2}]','2030-01-01 10:00Z',true,'00000000-0000-0000-0000-000000000002'); raise exception 'missing base accepted'; exception when raise_exception then if sqlerrm='missing base accepted' then raise;end if;end;
 -- A failing dependent write rolls the entire order back, including its quote consumption.
 q:=public.cart_quote('00000000-0000-0000-0000-000000000001',items,'2030-01-03 10:00Z',true,'00000000-0000-0000-0000-000000000002');
 begin perform public.create_cart_booking((q->>'quoteId')::uuid,'','cash','{}','personal',false,array['a','b','c','d']);raise exception 'invalid references accepted';exception when raise_exception then if sqlerrm='invalid references accepted' then raise;end if;end;
 assert (select count(*)=1 from public.bookings),'failure leaves no partial booking';
 assert (select booking_id is null from partner_private.cart_quotes where id=(q->>'quoteId')::uuid),'quote remains retryable';
 update partner_private.cart_quotes set expires_at=now()-interval '1 minute' where id=(q->>'quoteId')::uuid;
 begin perform public.create_cart_booking((q->>'quoteId')::uuid);raise exception 'expired quote accepted';exception when raise_exception then if sqlerrm='expired quote accepted' then raise;end if;end;
 begin perform public.cart_quote('00000000-0000-0000-0000-000000000001',items,'2030-01-03 10:00Z',true,'00000000-0000-0000-0000-000000000002','{}','2030-01-03 11:00Z');raise exception 'missed deadline accepted';exception when raise_exception then if sqlerrm='missed deadline accepted' then raise;end if;end;
 -- Listing changes cannot change an unexpired quote.
 q:=public.cart_quote('00000000-0000-0000-0000-000000000001',items,'2030-01-02 10:00Z',true,'00000000-0000-0000-0000-000000000002');
 update public.service_variants set suggested_price=180000 where template_id='nail-pilot' and id='gel';
 bid:=public.create_cart_booking((q->>'quoteId')::uuid);
 assert (select service_price=170000 from public.bookings where id=bid),'honor quote price';
 perform set_config('test.uid','00000000-0000-0000-0000-000000000004',true);
 begin perform public.create_cart_booking((q->>'quoteId')::uuid);raise exception 'foreign quote accepted';exception when insufficient_privilege then null;end;
end$$;
set local role authenticated;
do $$begin begin perform count(*) from partner_private.cart_quotes;raise exception 'quote table exposed';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;
