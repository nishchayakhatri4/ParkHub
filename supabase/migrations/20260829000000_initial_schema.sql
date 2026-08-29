create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'owner')),
  first_name text not null,
  last_name text not null,
  email text not null unique check (email = lower(email)),
  password_hash text not null check (password_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  license_plate text not null,
  car_model text not null
);

create table public.garages (
  parking_id text primary key check (parking_id ~ '^PARK-[0-9]{3,}$'),
  owner_id uuid not null references public.accounts(id) on delete cascade,
  parking_name text not null check (length(trim(parking_name)) > 0),
  location text not null check (length(trim(location)) > 0),
  address text not null check (length(trim(address)) > 0),
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  score numeric(2,1) not null default 0 check (score between 0 and 5),
  is_open boolean not null default true,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create index garages_owner_id_idx on public.garages(owner_id);
create index garages_open_idx on public.garages(is_open);

create table public.app_sessions (
  token uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '8 hours'
);

alter table public.accounts enable row level security;
alter table public.user_profiles enable row level security;
alter table public.garages enable row level security;
alter table public.app_sessions enable row level security;

create or replace function public.login_account(p_role text, p_email text, p_password text)
returns table(first_name text, email text, role text, session_token uuid)
language plpgsql security definer set search_path = public, extensions
as $$
declare v_account public.accounts;
declare v_token uuid;
begin
  select * into v_account from public.accounts a
  where a.email = lower(trim(p_email)) and a.role = lower(trim(p_role))
    and a.password_hash = encode(digest(p_password, 'sha256'), 'hex');
  if not found then return; end if;
  delete from public.app_sessions where expires_at <= now();
  insert into public.app_sessions(account_id) values (v_account.id) returning token into v_token;
  return query select v_account.first_name, v_account.email, v_account.role, v_token;
end;
$$;

create or replace function public.list_garages()
returns table(parking_id text, owner_email text, name text, location text, address text,
 hourly_rate numeric, score numeric, is_open boolean, latitude double precision, longitude double precision)
language sql stable security definer set search_path = public
as $$
  select g.parking_id, a.email, g.parking_name, g.location, g.address,
    g.hourly_rate, g.score, g.is_open, g.latitude, g.longitude
  from public.garages g join public.accounts a on a.id = g.owner_id
  order by g.parking_id;
$$;

create or replace function public.session_owner(p_session_token uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select a.id from public.app_sessions s join public.accounts a on a.id=s.account_id
 where s.token=p_session_token and s.expires_at>now() and a.role='owner' $$;

create or replace function public.list_owner_garages(p_session_token uuid)
returns table(parking_id text, parking_name text, address text)
language sql stable security definer set search_path = public
as $$ select g.parking_id,g.parking_name,g.address from public.garages g
 where g.owner_id=public.session_owner(p_session_token) order by g.parking_id $$;

create or replace function public.add_garage(p_session_token uuid, p_parking_name text,
 p_location text, p_address text, p_hourly_rate numeric, p_score numeric,
 p_is_open boolean, p_latitude double precision, p_longitude double precision)
returns text language plpgsql security definer set search_path = public
as $$
declare v_owner uuid := public.session_owner(p_session_token); v_id text;
begin
 if v_owner is null then raise exception 'Invalid or expired owner session'; end if;
 perform pg_advisory_xact_lock(8712401);
 select 'PARK-' || lpad((coalesce(max(substring(parking_id from 6)::int),0)+1)::text,3,'0')
 into v_id from public.garages;
 insert into public.garages values (v_id,v_owner,trim(p_parking_name),trim(p_location),
 trim(p_address),p_hourly_rate,p_score,p_is_open,p_latitude,p_longitude,now());
 return v_id;
end $$;

create or replace function public.remove_garage(p_session_token uuid, p_parking_id text)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
 delete from public.garages where parking_id=upper(trim(p_parking_id))
   and owner_id=public.session_owner(p_session_token);
 return found;
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant execute on function public.login_account(text,text,text) to anon, authenticated;
grant execute on function public.list_garages() to anon, authenticated;
grant execute on function public.list_owner_garages(uuid) to anon, authenticated;
grant execute on function public.add_garage(uuid,text,text,text,numeric,numeric,boolean,double precision,double precision) to anon, authenticated;
grant execute on function public.remove_garage(uuid,text) to anon, authenticated;
