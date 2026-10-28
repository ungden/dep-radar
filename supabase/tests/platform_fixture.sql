-- Supabase platform fixture for SQL-only QA on an existing local PostgreSQL.
-- Business schema, policies and RPCs come exclusively from real migrations.
-- This fixture does not emulate GoTrue, Storage HTTP or Realtime delivery.
do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls;end if;end$$;
create schema auth; create schema storage; create schema extensions;
create extension if not exists pgcrypto with schema extensions;
create table auth.users(id uuid primary key default gen_random_uuid(),instance_id uuid,aud text,role text,email text,phone text,encrypted_password text,email_confirmed_at timestamptz,phone_confirmed_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now(),raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}',banned_until timestamptz,deleted_at timestamptz,is_sso_user boolean default false,confirmation_token text,recovery_token text,email_change_token_new text,email_change text);
create table auth.sessions(id uuid primary key,user_id uuid);
create table auth.identities(id uuid primary key,user_id uuid,identity_data jsonb,provider text,provider_id text,last_sign_in_at timestamptz,created_at timestamptz,updated_at timestamptz,unique(provider,provider_id));
create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1]$$;
create publication supabase_realtime;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
grant all on all tables in schema auth,storage to service_role;
